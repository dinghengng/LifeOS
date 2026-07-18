"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchProfile, fetchProfilePosts } from "../../../../shared/api";
import { PublicProfile, ProfilePost } from "../../../../shared/types";
import AppShell from "../../../components/layout/AppShell";
import AppHeader from "../../../components/layout/AppHeader";
import ProfileCard from "../../../components/social/ProfileCard";

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [profileData, postsData] = await Promise.all([
          fetchProfile(userId),
          fetchProfilePosts(userId),
        ]);
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

  return (
    <AppShell>
      <AppHeader />
      {loading && <p className="text-sm text-slate-400">Loading profile...</p>}
      {notFound && <p className="text-sm text-red-500">This profile does not exist.</p>}
      {profile && <ProfileCard name={profile.name} username={profile.username} posts={posts} />}
    </AppShell>
  );
}