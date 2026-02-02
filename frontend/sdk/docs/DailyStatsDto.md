
# DailyStatsDto


## Properties

Name | Type
------------ | -------------
`currentStreak` | number
`bestStreak` | number
`totalGames` | number
`totalWins` | number
`winRate` | number
`averageScore` | number
`scoreDistribution` | Array&lt;number&gt;

## Example

```typescript
import type { DailyStatsDto } from ''

// TODO: Update the object below with actual values
const example = {
  "currentStreak": null,
  "bestStreak": null,
  "totalGames": null,
  "totalWins": null,
  "winRate": null,
  "averageScore": null,
  "scoreDistribution": null,
} satisfies DailyStatsDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as DailyStatsDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


