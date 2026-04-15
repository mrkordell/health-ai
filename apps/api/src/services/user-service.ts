import { eq } from 'drizzle-orm';
import { db, users, userProfiles, type User, type UserProfile } from '../db';
import { clerkClient } from '../lib/clerk';

export interface UserWithProfile {
  user: User;
  profile: UserProfile;
}

export async function getOrCreateUser(clerkUserId: string): Promise<UserWithProfile> {
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);

  if (existingUser.length > 0) {
    const profile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, clerkUserId))
      .limit(1);

    return {
      user: existingUser[0],
      profile: profile[0],
    };
  }

  const clerkUser = await clerkClient.users.getUser(clerkUserId);

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) {
    throw new Error(`Clerk user ${clerkUserId} has no email address`);
  }

  const [newUser] = await db
    .insert(users)
    .values({
      clerkUserId,
      email,
      fullName: `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim() || null,
      profileImageUrl: clerkUser.imageUrl,
    })
    .returning();

  const [newProfile] = await db
    .insert(userProfiles)
    .values({
      userId: clerkUserId,
    })
    .returning();

  return {
    user: newUser,
    profile: newProfile,
  };
}

export async function getUserByClerkId(clerkUserId: string): Promise<User | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);

  return result[0] ?? null;
}

export async function getUserProfile(clerkUserId: string): Promise<UserProfile | null> {
  const result = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, clerkUserId))
    .limit(1);

  return result[0] ?? null;
}
