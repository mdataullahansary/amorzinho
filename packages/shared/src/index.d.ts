export type UserRole = 'user' | 'admin';
export interface IUser {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    googleId?: string;
    spotifyId?: string;
    spotifyAccessToken?: string;
    spotifyRefreshToken?: string;
    coupleId?: string;
    isOnline: boolean;
    lastSeen?: Date | string;
    createdAt: Date | string;
}
export interface AuthResponse {
    token: string;
    user: IUser;
}
export interface LoginPayload {
    email: string;
    password: string;
}
export interface RegisterPayload {
    name: string;
    email: string;
    password: string;
}
export type Mood = 'happy' | 'sad' | 'excited' | 'anxious' | 'grateful' | 'in-love' | 'tired' | 'romantic';
export interface CurrentMood {
    user1?: Mood;
    user2?: Mood;
}
export interface ICouple {
    _id: string;
    user1: IUser | string;
    user2?: IUser | string;
    inviteCode: string;
    anniversaryDate?: Date | string;
    currentMood: CurrentMood;
    createdAt: Date | string;
}
export type MessageType = 'text' | 'image' | 'file' | 'voice';
export interface IReaction {
    userId: string;
    emoji: string;
}
export interface IMessage {
    _id: string;
    coupleId: string;
    senderId: string | IUser;
    type: MessageType;
    content?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    duration?: number;
    reactions: IReaction[];
    readAt?: Date | string;
    createdAt: Date | string;
}
export type TrackType = 'spotify' | 'uploaded';
export interface IUploadedTrack {
    _id: string;
    coupleId: string;
    uploadedBy: string | IUser;
    title: string;
    artist?: string;
    album?: string;
    duration?: number;
    fileUrl: string;
    albumArtUrl?: string;
    playCount: number;
    isFavorite: boolean;
    createdAt: Date | string;
}
export interface ISpotifyTrack {
    id: string;
    name: string;
    artists: {
        id: string;
        name: string;
    }[];
    album: {
        id: string;
        name: string;
        images: {
            url: string;
        }[];
    };
    duration_ms: number;
    preview_url?: string;
    external_urls: {
        spotify: string;
    };
}
export interface IPlaylist {
    _id: string;
    coupleId: string;
    name: string;
    description?: string;
    coverUrl?: string;
    tracks: string[];
    createdAt: Date | string;
}
export interface IListeningSession {
    _id: string;
    coupleId: string;
    trackId: string;
    trackType: TrackType;
    isPlaying: boolean;
    position: number;
    startedAt?: Date | string;
    pausedAt?: Date | string;
    participants: string[];
}
export interface IDiaryEntry {
    _id: string;
    coupleId: string;
    authorId: string | IUser;
    date: Date | string;
    title?: string;
    content: string;
    mood?: Mood;
    photos: string[];
    isShared: boolean;
    createdAt: Date | string;
}
export type MemoryTag = 'trip' | 'anniversary' | 'date' | 'random' | 'milestone' | 'birthday';
export interface IMediaItem {
    url: string;
    type: 'photo' | 'video';
    publicId?: string;
}
export interface IMemory {
    _id: string;
    coupleId: string;
    title: string;
    description?: string;
    mediaItems: IMediaItem[];
    tags: MemoryTag[];
    date: Date | string;
    createdAt: Date | string;
}
export interface IMovieSession {
    _id: string;
    coupleId: string;
    videoUrl: string;
    title?: string;
    isPlaying: boolean;
    currentTime: number;
    lastSyncAt: Date | string;
    participants: string[];
    createdAt: Date | string;
}
export type BucketCategory = 'travel' | 'experience' | 'milestone' | 'fun';
export interface IBucketItem {
    _id: string;
    coupleId: string;
    title: string;
    description?: string;
    category: BucketCategory;
    emoji?: string;
    isCompleted: boolean;
    completedAt?: Date | string;
    createdAt: Date | string;
}
export type NotificationType = 'new_message' | 'anniversary' | 'memory_reminder' | 'song_dedication' | 'diary_update' | 'bucket_completed' | 'partner_online';
export interface INotification {
    _id: string;
    userId: string;
    coupleId: string;
    type: NotificationType;
    title: string;
    body: string;
    isRead: boolean;
    metadata?: Record<string, unknown>;
    createdAt: Date | string;
}
export interface ICoupleAnalytics {
    daysTogether: number;
    messagesExchanged: number;
    songsListened: number;
    moviesWatched: number;
    memoriesCreated: number;
    diaryEntries: number;
    bucketCompleted: number;
    bucketTotal: number;
    topMoods: {
        mood: Mood;
        count: number;
    }[];
    messagesByDay: {
        date: string;
        count: number;
    }[];
}
export interface ChatSendPayload {
    coupleId: string;
    content?: string;
    type: MessageType;
    fileUrl?: string;
    fileName?: string;
    duration?: number;
}
export interface ChatTypingPayload {
    coupleId: string;
    isTyping: boolean;
}
export interface ChatReactPayload {
    messageId: string;
    emoji: string;
}
export interface MusicStatePayload {
    sessionId: string;
    trackId?: string;
    trackType?: TrackType;
    isPlaying: boolean;
    position: number;
    volume?: number;
}
export interface MusicQueuePayload {
    sessionId: string;
    trackId: string;
    trackType: TrackType;
}
export interface MovieStatePayload {
    sessionId: string;
    isPlaying: boolean;
    currentTime: number;
}
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}
export interface ApiError {
    message: string;
    code?: string;
    statusCode: number;
}
