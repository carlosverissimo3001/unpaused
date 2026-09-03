
# ShareResultDto


## Properties

Name | Type
------------ | -------------
`date` | string
`attempts` | number
`guessPattern` | string
`trackName` | string
`artistName` | string
`shareText` | string
`gameNumber` | number

## Example

```typescript
import type { ShareResultDto } from ''

// TODO: Update the object below with actual values
const example = {
  "date": null,
  "attempts": null,
  "guessPattern": null,
  "trackName": null,
  "artistName": null,
  "shareText": null,
  "gameNumber": null,
} satisfies ShareResultDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ShareResultDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


