import Vue from "vue";
import VueRouter, { Route } from "vue-router";
import { Store } from "vuex";

// augment typings of Vue.js
import "./vue";

type Dictionary<T> = { [key: string]: T };

type NuxtState = Dictionary<any>;

export interface Context {
  app: Vue;
  isClient: boolean;
  isServer: boolean;
  isStatic: boolean;
  isDev: boolean;
  isHMR: boolean;
  route: Route;
  store: Store<any>;
  env: Dictionary<any>;
  params: Route['params'];
  query: Route['query'];
  req: Request;
  res: Response;
  redirect(status: number, path: string, query?: Route['query']): void;
  redirect(path: string, query?: Route['query']): void;
  error(params: ErrorParams): void;
  nuxtState: NuxtState;
  beforeNuxtRender(fn: (params: { Components: VueRouter['getMatchedComponents'], nuxtState: NuxtState }) => void): void
}

export interface Transition {
  name?: string;
  mode?: string;
  css?: boolean;
  duration?: number;
  type?: string;
  enterClass?: string;
  enterToClass?: string;
  enterActiveClass?: string;
  leaveClass?: string;
  leaveToClass?: string;
  leaveActiveClass?: string;
}

export interface ErrorParams {
  statusCode?: number;
  message?: string;
}

export interface LoadingObject {
  start(): void;
  finish(): void;
}
