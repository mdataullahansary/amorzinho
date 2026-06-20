import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/User';

export function configurePassport(): void {
  // ─── Google OAuth Strategy ─────────────────────────────────────────────────
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
          proxy: true,
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) return done(new Error('No email from Google'));

            let user = await User.findOne({ googleId: profile.id });

            if (!user) {
              user = await User.findOne({ email });
              if (user) {
                user.googleId = profile.id;
                if (!user.avatar && profile.photos?.[0]?.value) {
                  user.avatar = profile.photos[0].value;
                }
                await user.save();
              } else {
                user = await User.create({
                  name: profile.displayName,
                  email,
                  googleId: profile.id,
                  avatar: profile.photos?.[0]?.value,
                });
              }
            }

            return done(null, user);
          } catch (err) {
            return done(err as Error);
          }
        }
      )
    );
  }

  // ─── Spotify OAuth Strategy ───────────────────────────────────────────────
  // NOTE: passport-spotify types need manual declaration for now
  if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
    // Dynamically require to avoid crash if env is not configured
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const SpotifyStrategy = require('passport-spotify').Strategy;
    passport.use(
      new SpotifyStrategy(
        {
          clientID: process.env.SPOTIFY_CLIENT_ID,
          clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
          callbackURL: process.env.SPOTIFY_CALLBACK_URL || '/api/auth/spotify/callback',
          scope: ['user-read-email', 'user-read-playback-state', 'user-modify-playback-state', 'streaming'],
          proxy: true,
        },
        async (
          accessToken: string,
          refreshToken: string,
          _expiresIn: number,
          profile: { id: string; displayName: string; emails?: { value: string }[]; photos?: { value: string }[] },
          done: (err: Error | null, user?: unknown) => void
        ) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) return done(new Error('No email from Spotify'));

            let user = await User.findOne({ spotifyId: profile.id });

            if (!user) {
              user = await User.findOne({ email });
              if (user) {
                user.spotifyId = profile.id;
                user.spotifyAccessToken = accessToken;
                user.spotifyRefreshToken = refreshToken;
                await user.save();
              } else {
                user = await User.create({
                  name: profile.displayName,
                  email,
                  spotifyId: profile.id,
                  spotifyAccessToken: accessToken,
                  spotifyRefreshToken: refreshToken,
                  avatar: profile.photos?.[0]?.value,
                });
              }
            } else {
              user.spotifyAccessToken = accessToken;
              user.spotifyRefreshToken = refreshToken;
              await user.save();
            }

            return done(null, user);
          } catch (err) {
            return done(err as Error);
          }
        }
      )
    );
  }
}
