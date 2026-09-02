/// <reference path="../.astro/types.d.ts" />
declare namespace App {
  interface Locals {
    adminEmail?: string;
  }
}

declare module '*.mp4' {
  const src: string;
  export default src;
}
