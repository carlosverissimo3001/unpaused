
# StreakStatusDto


## Properties

Name | Type
------------ | -------------
`currentStreak` | number
`bestStreak` | number
`playedToday` | boolean
`streakAtRisk` | boolean
`canSaveStreak` | boolean
`gapDays` | number
`freezesAvailable` | number
`freezeCost` | number
`isTrusted` | boolean

## Example

```typescript
import type { StreakStatusDto } from ''

// TODO: Update the object below with actual values
const example = {
  "currentStreak": null,
  "bestStreak": null,
  "playedToday": null,
  "streakAtRisk": null,
  "canSaveStreak": null,
  "gapDays": null,
  "freezesAvailable": null,
  "freezeCost": null,
  "isTrusted": null,
} satisfies StreakStatusDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as StreakStatusDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


