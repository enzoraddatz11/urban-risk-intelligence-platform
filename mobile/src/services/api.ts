import { API_URL } from '../config/api';
import { createApiClient } from './client';
export const api = createApiClient(API_URL);
