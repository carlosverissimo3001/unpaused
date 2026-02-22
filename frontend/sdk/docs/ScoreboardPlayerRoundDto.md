
# ScoreboardPlayerRoundDto


## Properties

Name | Type
------------ | -------------
`userId` | string
`displayName` | string
`avatarUrl` | string
`score` | number
`guessCount` | number
`won` | boolean

## Example

```typescript
import type { ScoreboardPlayerRoundDto } from ''

// TODO: Update the object below with actual values
const example = {
  "userId": null,
  "displayName": null,
  "avatarUrl": null,
  "score": null,
  "guessCount": null,
  "won": null,
} satisfies ScoreboardPlayerRoundDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ScoreboardPlayerRoundDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


