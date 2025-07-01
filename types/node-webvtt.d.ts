declare module "node-webvtt" {
  const webvtt: {
    parse: (vttData: string) => {
      cues: {
        start: number;
        end: number;
        text: string;
      }[];
    };
  };
  export default webvtt;
}
