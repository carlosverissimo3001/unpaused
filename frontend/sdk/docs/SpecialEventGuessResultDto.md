
# SpecialEventGuessResultDto


## Properties

Name | Type
------------ | -------------
`result` | [GuessResult](GuessResult.md)
`trackOver` | boolean
`runComplete` | boolean
`currentRound` | number
`snippetDuration` | number
`currentGuesses` | [Array&lt;GuessHistoryDto&gt;](GuessHistoryDto.md)
`reveal` | [TrackRevealDto](TrackRevealDto.md)

## Example

```typescript
import type { SpecialEventGuessResultDto } from ''

// TODO: Update the object below with actual values
const example = {
  "result": null,
  "trackOver": null,
  "runComplete": null,
  "currentRound": null,
  "snippetDuration": null,
  "currentGuesses": null,
  "reveal": null,
} satisfies SpecialEventGuessResultDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as SpecialEventGuessResultDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


