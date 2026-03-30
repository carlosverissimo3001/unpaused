# GauntletApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**gauntletControllerEndRun**](GauntletApi.md#gauntletcontrollerendrun) | **POST** /gauntlet/{id}/end | Voluntarily end a gauntlet run (quit) |
| [**gauntletControllerGetLeaderboard**](GauntletApi.md#gauntletcontrollergetleaderboard) | **GET** /gauntlet/leaderboard | Get gauntlet leaderboard |
| [**gauntletControllerGetPersonalBest**](GauntletApi.md#gauntletcontrollergetpersonalbest) | **GET** /gauntlet/personal-best | Get user\&#39;s gauntlet personal best |
| [**gauntletControllerGetRunState**](GauntletApi.md#gauntletcontrollergetrunstate) | **GET** /gauntlet/{id} | Get current gauntlet run state |
| [**gauntletControllerStartRun**](GauntletApi.md#gauntletcontrollerstartrun) | **POST** /gauntlet/start | Start a new gauntlet run |
| [**gauntletControllerSubmitGuess**](GauntletApi.md#gauntletcontrollersubmitguess) | **POST** /gauntlet/{id}/guess | Submit a guess for the current gauntlet track |



## gauntletControllerEndRun

> GauntletRunStateDto gauntletControllerEndRun(id)

Voluntarily end a gauntlet run (quit)

### Example

```ts
import {
  Configuration,
  GauntletApi,
} from '';
import type { GauntletControllerEndRunRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new GauntletApi(config);

  const body = {
    // string | The gauntlet run ID
    id: id_example,
  } satisfies GauntletControllerEndRunRequest;

  try {
    const data = await api.gauntletControllerEndRun(body);
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
| **id** | `string` | The gauntlet run ID | [Defaults to `undefined`] |

### Return type

[**GauntletRunStateDto**](GauntletRunStateDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## gauntletControllerGetLeaderboard

> GauntletLeaderboardDto gauntletControllerGetLeaderboard(getLeaderboardDto)

Get gauntlet leaderboard

### Example

```ts
import {
  Configuration,
  GauntletApi,
} from '';
import type { GauntletControllerGetLeaderboardRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new GauntletApi(config);

  const body = {
    // GetLeaderboardDto
    getLeaderboardDto: ...,
  } satisfies GauntletControllerGetLeaderboardRequest;

  try {
    const data = await api.gauntletControllerGetLeaderboard(body);
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
| **getLeaderboardDto** | [GetLeaderboardDto](GetLeaderboardDto.md) |  | |

### Return type

[**GauntletLeaderboardDto**](GauntletLeaderboardDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## gauntletControllerGetPersonalBest

> PersonalBestDto gauntletControllerGetPersonalBest()

Get user\&#39;s gauntlet personal best

### Example

```ts
import {
  Configuration,
  GauntletApi,
} from '';
import type { GauntletControllerGetPersonalBestRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new GauntletApi(config);

  try {
    const data = await api.gauntletControllerGetPersonalBest();
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

[**PersonalBestDto**](PersonalBestDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## gauntletControllerGetRunState

> GauntletRunStateDto gauntletControllerGetRunState(id)

Get current gauntlet run state

### Example

```ts
import {
  Configuration,
  GauntletApi,
} from '';
import type { GauntletControllerGetRunStateRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new GauntletApi(config);

  const body = {
    // string | The gauntlet run ID
    id: id_example,
  } satisfies GauntletControllerGetRunStateRequest;

  try {
    const data = await api.gauntletControllerGetRunState(body);
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
| **id** | `string` | The gauntlet run ID | [Defaults to `undefined`] |

### Return type

[**GauntletRunStateDto**](GauntletRunStateDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## gauntletControllerStartRun

> GauntletRunStateDto gauntletControllerStartRun(startRunDto)

Start a new gauntlet run

### Example

```ts
import {
  Configuration,
  GauntletApi,
} from '';
import type { GauntletControllerStartRunRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new GauntletApi(config);

  const body = {
    // StartRunDto
    startRunDto: ...,
  } satisfies GauntletControllerStartRunRequest;

  try {
    const data = await api.gauntletControllerStartRun(body);
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
| **startRunDto** | [StartRunDto](StartRunDto.md) |  | |

### Return type

[**GauntletRunStateDto**](GauntletRunStateDto.md)

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


## gauntletControllerSubmitGuess

> GauntletGuessResultDto gauntletControllerSubmitGuess(id, submitGauntletGuessDto)

Submit a guess for the current gauntlet track

### Example

```ts
import {
  Configuration,
  GauntletApi,
} from '';
import type { GauntletControllerSubmitGuessRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: cookie
    apiKey: "YOUR API KEY",
  });
  const api = new GauntletApi(config);

  const body = {
    // string | The gauntlet run ID
    id: id_example,
    // SubmitGauntletGuessDto
    submitGauntletGuessDto: ...,
  } satisfies GauntletControllerSubmitGuessRequest;

  try {
    const data = await api.gauntletControllerSubmitGuess(body);
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
| **id** | `string` | The gauntlet run ID | [Defaults to `undefined`] |
| **submitGauntletGuessDto** | [SubmitGauntletGuessDto](SubmitGauntletGuessDto.md) |  | |

### Return type

[**GauntletGuessResultDto**](GauntletGuessResultDto.md)

### Authorization

[cookie](../README.md#cookie)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |
| **429** | Rate limit exceeded |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

