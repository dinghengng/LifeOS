"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { checkAuthStatus, fetchProfile, fetchProfilePosts } from "../../../../shared/api";
import { PublicProfile, ProfilePost, User } from "../../../../shared/types";
import AppShell from "../../../components/layout/AppShell";
import AppHeader from "../../../components/layout/AppHeader";
import ProfileCard from "../../../components/social/ProfileCard";

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [user, profileData, postsData] = await Promise.all([
          checkAuthStatus(),
          fetchProfile(userId),
          fetchProfilePosts(userId),
        ]);
        setCurrentUser(user);
        setProfile(profileData);
        setPosts(postsData);
      } catch (err) {
        console.error(err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const handleKudosChange = (postId: number, kudosCount: number, hasKudosed: boolean) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, kudosCount, hasKudosed } : p)));
  };

  return (
    <AppShell>
      <AppHeader />
      {loading && <p className="text-sm text-slate-400">Loading profile...</p>}
      {notFound && <p className="text-sm text-red-500">This profile does not exist.</p>}
      {profile && (
        <ProfileCard
          name={profile.name}
          username={profile.username}
          posts={posts}
          isOwnProfile={currentUser?.id === profile.id}
          onKudosChange={handleKudosChange}
        />
      )}
    </AppShell>
  );
}