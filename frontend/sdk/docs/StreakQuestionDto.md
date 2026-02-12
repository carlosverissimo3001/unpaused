
# StreakQuestionDto


## Properties

Name | Type
------------ | -------------
`id` | string
`question` | string
`options` | Array&lt;string&gt;
`correctAnswerIndex` | number
`category` | string
`context` | string
`isActive` | boolean
`addedBy` | string
`createdAt` | Date
`updatedAt` | Date

## Example

```typescript
import type { StreakQuestionDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "question": null,
  "options": null,
  "correctAnswerIndex": null,
  "category": null,
  "context": null,
  "isActive": null,
  "addedBy": null,
  "createdAt": null,
  "updatedAt": null,
} satisfies StreakQuestionDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as StreakQuestionDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


