
# StreakFreezeUsageDto


## Properties

Name | Type
------------ | -------------
`id` | string
`coveredFrom` | string
`coveredTo` | string
`freezesUsed` | number
`gapDays` | number
`streakAtTime` | number

## Example

```typescript
import type { StreakFreezeUsageDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "coveredFrom": null,
  "coveredTo": null,
  "freezesUsed": null,
  "gapDays": null,
  "streakAtTime": null,
} satisfies StreakFreezeUsageDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as StreakFreezeUsageDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


