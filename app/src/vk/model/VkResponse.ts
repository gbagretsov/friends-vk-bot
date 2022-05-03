export type VkSuccessResponse<TResponse> = {
  response: TResponse;
}

export type VkErrorResponse = {
  error: VkError
}

export type VkExecuteErrorsResponse = {
  execute_errors: VkError[];
}

export function isVkErrorResponse(vkResponse: unknown): vkResponse is VkErrorResponse {
  return !!(vkResponse as VkErrorResponse).error;
}

export function isVkExecuteErrorResponse(vkResponse: unknown): vkResponse is VkExecuteErrorsResponse {
  return !!(vkResponse as VkExecuteErrorsResponse).execute_errors;
}

type VkError = {
  error_code: number;
  error_msg: string;
};
