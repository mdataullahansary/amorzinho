import { Server, Socket } from 'socket.io';
import { Message } from '../models/Message';
import { Notification } from '../models/Notification';
import { Couple } from '../models/Couple';
import type { ChatSendPayload, ChatTypingPayload, ChatReactPayload } from '@amorzinho/shared';

type AuthSocket = Socket & { userId: string; coupleId?: string };

export function registerChatHandlers(io: Server, socket: AuthSocket): void {
  // ─── Send Message ─────────────────────────────────────────────────────────
  socket.on('chat:send', async (payload: ChatSendPayload) => {
    try {
      const { coupleId, content, type, fileUrl, fileName, duration } = payload;

      const message = await Message.create({
        coupleId,
        senderId: socket.userId,
        type,
        content,
        fileUrl,
        fileName,
        duration,
        reactions: [],
      });

      const populated = await message.populate('senderId', 'name avatar');

      // Broadcast to couple room (both users receive it)
      io.to(`couple:${coupleId}`).emit('chat:receive', { message: populated });

      // Create notification for partner
      const couple = await Couple.findById(coupleId);
      if (couple) {
        const partnerId =
          couple.user1.toString() === socket.userId
            ? couple.user2?.toString()
            : couple.user1.toString();

        if (partnerId) {
          await Notification.create({
            userId: partnerId,
            coupleId,
            type: 'new_message',
            title: 'New message 💬',
            body: type === 'text' ? (content?.slice(0, 80) || '') : `Sent a ${type}`,
            metadata: { messageId: message._id },
          });
        }
      }
    } catch (err) {
      socket.emit('error', { message: 'Failed to send message' });
      console.error('[chat:send]', err);
    }
  });

  // ─── Typing Indicator ─────────────────────────────────────────────────────
  socket.on('chat:typing', (payload: ChatTypingPayload) => {
    socket.to(`couple:${payload.coupleId}`).emit('chat:typing', {
      userId: socket.userId,
      isTyping: payload.isTyping,
    });
  });

  // ─── Reactions ────────────────────────────────────────────────────────────
  socket.on('chat:react', async (payload: ChatReactPayload) => {
    try {
      const message = await Message.findById(payload.messageId);
      if (!message) return;

      const existingIdx = message.reactions.findIndex(
        (r) => r.userId.toString() === socket.userId
      );

      if (existingIdx > -1) {
        if (message.reactions[existingIdx].emoji === payload.emoji) {
          message.reactions.splice(existingIdx, 1); // toggle off
        } else {
          message.reactions[existingIdx].emoji = payload.emoji; // change emoji
        }
      } else {
        message.reactions.push({ userId: socket.userId as unknown as typeof message.reactions[0]['userId'], emoji: payload.emoji });
      }

      await message.save();

      io.to(`couple:${message.coupleId.toString()}`).emit('chat:reaction', {
        messageId: payload.messageId,
        reactions: message.reactions,
      });
    } catch (err) {
      console.error('[chat:react]', err);
    }
  });

  // ─── Read Receipt ─────────────────────────────────────────────────────────
  socket.on('chat:read', async ({ messageId }: { messageId: string }) => {
    try {
      const message = await Message.findByIdAndUpdate(
        messageId,
        { readAt: new Date() },
        { new: true }
      );
      if (!message) return;

      io.to(`couple:${message.coupleId.toString()}`).emit('chat:read-receipt', {
        messageId,
        readAt: message.readAt,
      });
    } catch (err) {
      console.error('[chat:read]', err);
    }
  });
}
