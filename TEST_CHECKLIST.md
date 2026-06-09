# Test Checklist

Run this checklist after every development round before committing.

---

## 1. Build Checks (Required)

```bash
cd D:\Download\dnd

npx tsc --noEmit
# Expected: no errors, no output

npm run build
# Expected: build succeeds, dist/ generated without errors
```

Both must pass before committing.

---

## 2. Page Smoke Tests (Manual)

Open the app in the browser and verify each page loads without crashing.

### D&D

- [ ] DND Creator — opens, fields editable
- [ ] DND Sheet — opens, displays character data
- [ ] DND Gameplay — opens, dice tray functional

### Call of Cthulhu

- [ ] COC Creator — opens, fields editable
- [ ] COC Sheet — opens and displays investigator data; no Sheet skill-roll toast expected
- [ ] COC Gameplay — opens, HP/SAN/MP buttons functional, dice tray functional
- [ ] COC Gameplay — public skill checks run from Gameplay and update RollConsole Latest Result
- [ ] COC Gameplay — RuntimeLogEntry history log updates after skill checks / runtime changes

### Cyberpunk RED

- [ ] CP Creator — opens, fields editable
- [ ] CP Sheet — opens and displays character data; no Sheet skill quick-roll toast expected
- [ ] CP Gameplay — opens, skill check and stat check functional
- [ ] CP Gameplay — after RollConsole/RuntimeLogEntry wiring is implemented, check results enter Latest Result and history log
- [ ] CP Gameplay — after no-DV support is implemented, checks without DV show "waiting GM judgment"
- [ ] CP Market — opens without crash

---

## 3. Persistence Check

- [ ] Enter / modify character data on any sheet
- [ ] Hard-refresh the page (F5 / Cmd+R)
- [ ] Confirm data is still present (Zustand persist via localStorage)

---

## 4. Migration / Import Check

- [ ] Load a character saved under a previous schema version (if available)
- [ ] Confirm the character opens without crash or blank fields
- [ ] Confirm migrateDndCharacter / migrateCocCharacter / migrateCpCharacter ran silently

---

## 5. Console Check

- [ ] Open browser DevTools → Console
- [ ] No red errors on page load
- [ ] No red errors after performing a dice roll or stat check
- [ ] No TypeScript runtime errors (undefined access, etc.)

---

## 6. System Isolation Check

After modifying one system, verify the other two are unaffected:

- [ ] DND pages still load after COC or CP changes
- [ ] COC pages still load after DND or CP changes
- [ ] CP pages still load after DND or COC changes

---

## 7. Pre-Commit Checklist Summary

| Step | Command / Action | Pass? |
|------|-----------------|-------|
| Type check | `npx tsc --noEmit` | ☐ |
| Build | `npm run build` | ☐ |
| DND pages load | Manual | ☐ |
| COC pages load | Manual | ☐ |
| CP pages load | Manual | ☐ |
| Data persists on refresh | Manual | ☐ |
| Old character import OK | Manual | ☐ |
| Console clean | DevTools | ☐ |

All rows checked → `git add -A && git commit`.
