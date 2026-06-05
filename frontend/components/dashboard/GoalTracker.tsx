import GoalCard, { Goal } from "./GoalCard";

export default function GoalTracker({
  goals,
  onAddClick,
  onMilestoneToggle,
}: {
  goals: Goal[];
  onAddClick: () => void;
  onMilestoneToggle: (goalId: string, milestoneIndex: number) => void;
}) {
  return (
    <div
      style={{
        background: "var(--color-background-primary)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)",
        padding: "1.25rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 500,
            color: "var(--color-text-primary)",
          }}
        >
          Goal tracker
        </h2>
        <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
          {goals.length} active
        </span>
      </div>

      {goals.map((goal) => (
        <GoalCard
          key={goal.id}
          goal={goal}
          onMilestoneToggle={onMilestoneToggle} // ✅ FIXED: Passing down the state handler to each card item
        />
      ))}

      <button
        onClick={onAddClick}
        style={{
          marginTop: 2,
          width: "100%",
          padding: "8px 0",
          fontSize: 13,
          color: "var(--color-text-secondary)",
          background: "transparent",
          border: "0.5px dashed var(--color-border-secondary)",
          borderRadius: "var(--border-radius-md)",
          cursor: "pointer",
        }}
      >
        + Add goal
      </button>
    </div>
  );
}
