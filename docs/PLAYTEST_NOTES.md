# Playtest Notes

Use this single file for each QA pass. Keep entries short and actionable.

## How To Use
1. Copy the `Session Template` block to the top of this file.
2. Fill in pass/fail and notes while testing.
3. Save the file.
4. Tell me "playtest notes are updated" and I will parse this file and turn failures into a fix list.

## Session Template

### Session
- Date:
- Scope: Spec-core + Milestone 1 (Woodcutting, Fishing, Firemaking, Cooking)
- Build/Branch:
- Tester:

### Checklist
- [ ] Boot + smoke (game loads, movement, context menu, no crash overlay)
- [ ] Woodcutting tick loop works (logs + XP + stop on full inv)
- [ ] Woodcutting depletion works (tree depletion stops action)
- [ ] Fishing tick loop works (raw shrimp + XP + stop on full inv)
- [ ] Fishing rod+bait rule works (requires bait to start/continue; consumes bait on successful catch only)
- [ ] Fishing method selection UX works (left-click picks highest-tier eligible method; shallow right-click shows Net/Rod/Harpoon Water options)
- [ ] Deep-water split works (normal harpoon catches mixed tuna/swordfish; rune harpoon catches swordfish-only)
- [ ] Fishing method override works (using selected tool method on water does not get overridden by higher-tier inventory tool)
- [ ] Harpoon equip works (harpoon and rune harpoon equip into weapon slot)
- [ ] Firemaking success/fail works (consumes log only on success)
- [ ] Fire placement guard works (cannot light on active fire tile)
- [ ] Fire step behavior works (step after successful light)
- [ ] Cooking loop works (use raw shrimp on fire, repeat attempts)
- [ ] Cooking outcomes work (cooked/burnt results, XP only on success)
- [ ] Cooking stop conditions work (fire out, no input, full inventory)
- [ ] Regression smoke (shop/bank/mining/runecrafting still usable)

### Bugs
Use one block per bug.

#### Bug: <short title>
- Severity: Blocker | High | Medium | Low
- Area: Woodcutting | Fishing | Firemaking | Cooking | UI | Runtime | Other
- Repro steps:
  1.
  2.
  3.
- Expected:
- Actual:
- Frequency: Always | Often | Sometimes | Once
- Evidence: (screenshot path / console error / clip path)

### Summary
- Passed:
- Failed:
- Blocked:
- Go/No-Go:
- Notes:
