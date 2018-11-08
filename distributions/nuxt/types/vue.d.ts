/**
 * Extends interfaces in Vue.js
 */

import Vue, { ComponentOptions } from "vue";
import { Route } from "vue-router";
import { MetaInfo } from "vue-meta";
import { Context, Transition, LoadingObject } from "./index";

declare module "vue/types/options" {
  interface ComponentOptions<V extends Vue> {
    asyncData?(ctx: Context): object;
    fetch?(ctx: Context): Promise<void> | void;
    head?: MetaInfo | (() => MetaInfo);
    layout?: string | ((ctx: Context) => string);
    middleware?: string | string[];
    scrollToTop?: boolean;
    transition?: string | Transition | ((to: Route, from: Route) => string);
    key?: string | ((to: Route) => string);
    validate?(ctx: Context): Promise<boolean> | boolean;
    watchQuery?: boolean | string[];
  }
}

declare module "vue/types/vue" {
  interface Vue {
    $nuxt: {
      $loading: LoadingObject;
    };
  }
}
