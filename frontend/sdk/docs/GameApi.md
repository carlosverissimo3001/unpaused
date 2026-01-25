# GameApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**gameControllerGetGameState**](GameApi.md#gamecontrollergetgamestate) | **GET** /game/{id} | Get current game state |
| [**gameControllerStartGame**](GameApi.md#gamecontrollerstartgame) | **POST** /game/start | Start a new game from a playlist |
| [**gameControllerSubmitGuess**](GameApi.md#gamecontrollersubmitguess) | **POST** /game/{id}/guess | Submit a guess for a specific session |



## gameControllerGetGameState

> GameStateDto gameControllerGetGameState(id)

Get current game state

### Example

```ts
import {
  Configuration,
  GameApi,
} from '';
import type { GameControllerGetGameStateRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new GameApi();

  const body = {
    // string | The internal Game Session UUID
    id: id_example,
  } satisfies GameControllerGetGameStateRequest;

  try {
    const data = await api.gameControllerGetGameState(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` | The internal Game Session UUID | [Defaults to `undefined`] |

### Return type

[**GameStateDto**](GameStateDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## gameControllerStartGame

> GameStateDto gameControllerStartGame(startGameDto)

Start a new game from a playlist

### Example

```ts
import {
  Configuration,
  GameApi,
} from '';
import type { GameControllerStartGameRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new GameApi(config);

  const body = {
    // StartGameDto
    startGameDto: ...,
  } satisfies GameControllerStartGameRequest;

  try {
    const data = await api.gameControllerStartGame(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **startGameDto** | [StartGameDto](StartGameDto.md) |  | |

### Return type

[**GameStateDto**](GameStateDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## gameControllerSubmitGuess

> GuessResultDto gameControllerSubmitGuess(id, guessDto)

Submit a guess for a specific session

### Example

```ts
import {
  Configuration,
  GameApi,
} from '';
import type { GameControllerSubmitGuessRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new GameApi();

  const body = {
    // string | The internal Game Session UUID
    id: id_example,
    // GuessDto
    guessDto: ...,
  } satisfies GameControllerSubmitGuessRequest;

  try {
    const data = await api.gameControllerSubmitGuess(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` | The internal Game Session UUID | [Defaults to `undefined`] |
| **guessDto** | [GuessDto](GuessDto.md) |  | |

### Return type

[**GuessResultDto**](GuessResultDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

