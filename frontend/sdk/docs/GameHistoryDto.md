
# GameHistoryDto


## Properties

Name | Type
------------ | -------------
`items` | [Array&lt;GameHistoryEntryDto&gt;](GameHistoryEntryDto.md)
`total` | number
`streakFreezeUsages` | [Array&lt;StreakFreezeUsageDto&gt;](StreakFreezeUsageDto.md)

## Example

```typescript
import type { GameHistoryDto } from ''

// TODO: Update the object below with actual values
const example = {
  "items": null,
  "total": null,
  "streakFreezeUsages": null,
} satisfies GameHistoryDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as GameHistoryDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


