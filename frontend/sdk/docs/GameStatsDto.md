
# GameStatsDto


## Properties

Name | Type
------------ | -------------
`currentStreak` | number
`bestStreak` | number
`totalGames` | number
`totalWins` | number
`roundDistribution` | Array&lt;number&gt;
`mode` | string
`winRate` | number
`averageScore` | number

## Example

```typescript
import type { GameStatsDto } from ''

// TODO: Update the object below with actual values
const example = {
  "currentStreak": null,
  "bestStreak": null,
  "totalGames": null,
  "totalWins": null,
  "roundDistribution": [0,0,0,0,0,0,0],
  "mode": null,
  "winRate": 0.5,
  "averageScore": 3.5,
} satisfies GameStatsDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as GameStatsDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


