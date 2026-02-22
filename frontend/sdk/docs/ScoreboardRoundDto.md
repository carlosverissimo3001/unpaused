
# ScoreboardRoundDto


## Properties

Name | Type
------------ | -------------
`roundIndex` | number
`players` | [Array&lt;ScoreboardPlayerRoundDto&gt;](ScoreboardPlayerRoundDto.md)
`trackName` | string
`artistName` | string
`albumImageUrl` | string

## Example

```typescript
import type { ScoreboardRoundDto } from ''

// TODO: Update the object below with actual values
const example = {
  "roundIndex": null,
  "players": null,
  "trackName": null,
  "artistName": null,
  "albumImageUrl": null,
} satisfies ScoreboardRoundDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ScoreboardRoundDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


