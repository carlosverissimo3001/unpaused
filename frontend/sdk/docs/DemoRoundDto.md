
# DemoRoundDto


## Properties

Name | Type
------------ | -------------
`roundId` | string
`previewUrl` | string
`attempt` | number
`totalAttempts` | number
`snippetDuration` | number
`snippetSteps` | Array&lt;number&gt;
`options` | [Array&lt;DemoOptionDto&gt;](DemoOptionDto.md)

## Example

```typescript
import type { DemoRoundDto } from ''

// TODO: Update the object below with actual values
const example = {
  "roundId": null,
  "previewUrl": null,
  "attempt": null,
  "totalAttempts": null,
  "snippetDuration": null,
  "snippetSteps": null,
  "options": null,
} satisfies DemoRoundDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as DemoRoundDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


