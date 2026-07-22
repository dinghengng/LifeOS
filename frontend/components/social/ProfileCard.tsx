import { ProfilePost } from "../../../shared/types";
import { AchievementPost } from "./AchievementPost";

interface ProfileCardProps {
  name: string | null;
  username: string;
  posts: ProfilePost[];
  isOwnProfile: boolean;
  onKudosChange: (postId: number, kudosCount: number, hasKudosed: boolean) => void;
}

export default function ProfileCard({ name, username, posts, isOwnProfile, onKudosChange }: ProfileCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-lg font-semibold text-white">
          {(name || username).charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-base font-semibold text-slate-900">{name || username}</p>
          <p className="text-sm text-slate-500">@{username}</p>
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-3">
        {posts.length === 0 ? (
          <p className="text-sm text-slate-400">No achievements shared yet.</p>
        ) : (
          posts.map((post) => (
            <AchievementPost key={post.id} post={post} isOwnPost={isOwnProfile} onKudosChange={onKudosChange} />
          ))
        )}
      </div>
    </div>
  );
}