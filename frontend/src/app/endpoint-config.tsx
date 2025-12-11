"use client";

import { API_BASE, WS_BASE } from "@/config/endpoints";
import { configureWebsocketBase as configureChatShim } from "chat-shim";
import {
  configureApiBase,
  configureWebsocketBase as configureStreamShimWs,
} from "@iliad/stream-chat-shim";

configureChatShim(WS_BASE);
configureStreamShimWs(WS_BASE);
configureApiBase(API_BASE);

export function EndpointConfig() {
  return null;
}

export default EndpointConfig;
