import { ProfilePost } from "../../../shared/types";

interface ProfileCardProps {
  name: string | null;
  username: string;
  posts: ProfilePost[];
}

const TIER_COLORS: Record<string, string> = {
  bronze: "#B08D57",
  silver: "#9CA3AF",
  gold: "#D4AF37",
};

export default function ProfileCard({ name, username, posts }: ProfileCardProps) {
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
            <div
              key={post.id}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: TIER_COLORS[post.tier] }} />
                <span className="text-sm font-medium capitalize text-slate-700">
                  {post.tier} — {post.challengeTitle}
                </span>
              </div>
              <span className="text-xs text-slate-400">{post.kudosCount} kudos</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}