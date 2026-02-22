
# ScoreboardDto


## Properties

Name | Type
------------ | -------------
`rounds` | [Array&lt;ScoreboardRoundDto&gt;](ScoreboardRoundDto.md)
`standings` | [Array&lt;ScoreboardPlayerTotalDto&gt;](ScoreboardPlayerTotalDto.md)
`roomStatus` | string
`isComplete` | boolean

## Example

```typescript
import type { ScoreboardDto } from ''

// TODO: Update the object below with actual values
const example = {
  "rounds": null,
  "standings": null,
  "roomStatus": null,
  "isComplete": null,
} satisfies ScoreboardDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ScoreboardDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


