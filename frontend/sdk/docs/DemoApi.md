# DemoApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**demoControllerGetPlaylists**](DemoApi.md#democontrollergetplaylists) | **GET** /demo/playlists | Playlists a demo round can be started from |
| [**demoControllerGuess**](DemoApi.md#democontrollerguess) | **POST** /demo/rounds/{roundId}/guesses | Score a guess; reveals the answer when resolved |
| [**demoControllerStartRound**](DemoApi.md#democontrollerstartround) | **POST** /demo/rounds | Start a round; the answer stays server-side |



## demoControllerGetPlaylists

> Array&lt;DemoPlaylistDto&gt; demoControllerGetPlaylists()

Playlists a demo round can be started from

### Example

```ts
import {
  Configuration,
  DemoApi,
} from '';
import type { DemoControllerGetPlaylistsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DemoApi();

  try {
    const data = await api.demoControllerGetPlaylists();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**Array&lt;DemoPlaylistDto&gt;**](DemoPlaylistDto.md)

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


## demoControllerGuess

> DemoGuessResultDto demoControllerGuess(roundId, guessDemoDto)

Score a guess; reveals the answer when resolved

### Example

```ts
import {
  Configuration,
  DemoApi,
} from '';
import type { DemoControllerGuessRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DemoApi();

  const body = {
    // string
    roundId: roundId_example,
    // GuessDemoDto
    guessDemoDto: ...,
  } satisfies DemoControllerGuessRequest;

  try {
    const data = await api.demoControllerGuess(body);
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
| **roundId** | `string` |  | [Defaults to `undefined`] |
| **guessDemoDto** | [GuessDemoDto](GuessDemoDto.md) |  | |

### Return type

[**DemoGuessResultDto**](DemoGuessResultDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** |  |  -  |
| **404** | Round not found or expired |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## demoControllerStartRound

> DemoRoundDto demoControllerStartRound(startDemoRoundDto)

Start a round; the answer stays server-side

### Example

```ts
import {
  Configuration,
  DemoApi,
} from '';
import type { DemoControllerStartRoundRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DemoApi();

  const body = {
    // StartDemoRoundDto
    startDemoRoundDto: ...,
  } satisfies DemoControllerStartRoundRequest;

  try {
    const data = await api.demoControllerStartRound(body);
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
| **startDemoRoundDto** | [StartDemoRoundDto](StartDemoRoundDto.md) |  | |

### Return type

[**DemoRoundDto**](DemoRoundDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** |  |  -  |
| **503** | Track pool not populated yet |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

