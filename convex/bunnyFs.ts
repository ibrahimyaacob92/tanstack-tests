import { ConvexFS } from "convex-fs";
import { components } from "./_generated/api";

// Initialize ConvexFS with Bunny.net storage
export const fs = new ConvexFS(components.fs, {
  storage: {
    type: "bunny",
    apiKey: process.env.BUNNY_API_KEY!, // get from the storage zone api access settings, they label it "password" field
    storageZoneName: process.env.BUNNY_STORAGE_ZONE!, // this is the name of the storage zone, you can find it in the storage zone settings
    region: process.env.BUNNY_REGION, // this is not explicit in bunny.net, i just paste the SG region name here (same as where i set)
    cdnHostname: process.env.BUNNY_CDN_HOSTNAME!, // this is the cdn (pull zone) hostname, not the storage host name
    tokenKey: process.env.BUNNY_TOKEN_KEY, // you get this from pull zone > security > token authentication
  },
});
