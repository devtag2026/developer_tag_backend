/**
 * Milestone delivery helpers.
 * Payment only updates payment status; current milestone advances when due date
 * passes (paid + in_progress + due date passed) or admin marks complete.
 */

export const isMilestoneDueDateExceeded = (dueDate) => {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return false;

  const endOfDueDayUtc = Date.UTC(
    due.getUTCFullYear(),
    due.getUTCMonth(),
    due.getUTCDate(),
    23,
    59,
    59,
    999,
  );
  return Date.now() > endOfDueDayUtc;
};

/**
 * The active milestone is the first paid-but-incomplete one, otherwise the stored index.
 */
export const getEffectiveCurrentMilestoneIndex = (milestones, currentMilestoneIndex = 0) => {
  if (!milestones?.length) return 0;

  const paidIncompleteIndex = milestones.findIndex(
    (m) => m.status === "paid" && m.workStatus !== "completed",
  );
  if (paidIncompleteIndex !== -1) return paidIncompleteIndex;

  const firstIncompleteIndex = milestones.findIndex(
    (m) => m.workStatus !== "completed",
  );
  if (firstIncompleteIndex !== -1) return firstIncompleteIndex;

  return currentMilestoneIndex;
};

export const resolveMilestoneWorkStatus = (milestone, index, currentMilestoneIndex, milestones) => {
  const effectiveCurrent = milestones
    ? getEffectiveCurrentMilestoneIndex(milestones, currentMilestoneIndex)
    : currentMilestoneIndex;

  if (milestone.workStatus === "completed") return "completed";
  if (index === effectiveCurrent) return "in_progress";
  if (milestone.workStatus === "in_progress") return "in_progress";
  if (milestone.workStatus === "upcoming") return "upcoming";
  return "upcoming";
};

const completeMilestoneAtIndex = (contract, milestoneIndex) => {
  const milestone = contract.milestones[milestoneIndex];
  milestone.workStatus = "completed";
  milestone.completedAt = new Date();

  const isLastMilestone = milestoneIndex === contract.milestones.length - 1;
  if (isLastMilestone) {
    contract.status = "completed";
    contract.completedAt = new Date();
    return { advanced: false, contractCompleted: true };
  }

  contract.currentMilestoneIndex = milestoneIndex + 1;
  contract.milestones[contract.currentMilestoneIndex].workStatus = "in_progress";
  if (contract.status === "accepted") {
    contract.status = "active";
  }

  return { advanced: true, contractCompleted: false };
};

/**
 * Fix contracts where currentMilestoneIndex was advanced on payment before
 * the milestone was actually completed.
 */
export const repairMilestoneProgress = (contract) => {
  if (!contract?.milestones?.length) return false;

  const { milestones } = contract;
  let modified = false;

  const targetIndex = getEffectiveCurrentMilestoneIndex(
    milestones,
    contract.currentMilestoneIndex,
  );

  if (contract.currentMilestoneIndex !== targetIndex) {
    contract.currentMilestoneIndex = targetIndex;
    modified = true;
  }

  milestones.forEach((milestone, index) => {
    if (milestone.workStatus === "completed") return;

    if (index === contract.currentMilestoneIndex) {
      if (milestone.workStatus !== "in_progress") {
        milestone.workStatus = "in_progress";
        modified = true;
      }
    } else if (milestone.workStatus !== "upcoming") {
      milestone.workStatus = "upcoming";
      modified = true;
    }
  });

  if (modified) {
    contract.markModified("milestones");
  }

  return modified;
};

/**
 * Auto-complete the current milestone when it is paid, in progress, and past due.
 */
export const processAutoMilestoneCompletion = (contract) => {
  if (!contract?.milestones?.length) return false;
  if (!["active", "accepted"].includes(contract.status)) return false;

  let modified = false;

  while (contract.currentMilestoneIndex < contract.milestones.length) {
    const index = contract.currentMilestoneIndex;
    const milestone = contract.milestones[index];

    if (milestone.workStatus === "completed") {
      break;
    }

    const canAutoComplete =
      milestone.workStatus === "in_progress" &&
      milestone.status === "paid" &&
      isMilestoneDueDateExceeded(milestone.dueDate);

    if (!canAutoComplete) break;

    completeMilestoneAtIndex(contract, index);
    modified = true;

    if (contract.status === "completed") break;
  }

  if (modified) {
    contract.markModified("milestones");
  }

  return modified;
};

export const syncMilestoneState = (contract) => {
  const repaired = repairMilestoneProgress(contract);
  const autoCompleted = processAutoMilestoneCompletion(contract);
  return repaired || autoCompleted;
};

export const completeMilestoneById = (contract, milestoneId) => {
  const milestoneIndex = contract.milestones.findIndex(
    (m) => m._id.toString() === milestoneId,
  );
  if (milestoneIndex === -1) {
    return { ok: false, error: "Milestone not found" };
  }

  if (milestoneIndex !== contract.currentMilestoneIndex) {
    return { ok: false, error: "Only the current milestone can be marked as completed" };
  }

  const milestone = contract.milestones[milestoneIndex];

  if (milestone.workStatus === "completed") {
    return { ok: false, error: "This milestone is already completed" };
  }

  if (milestone.status !== "paid") {
    return {
      ok: false,
      error: "Milestone must be paid before it can be marked as completed",
    };
  }

  const result = completeMilestoneAtIndex(contract, milestoneIndex);
  contract.markModified("milestones");
  return { ok: true, ...result };
};
