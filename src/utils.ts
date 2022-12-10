import axios from 'axios';
import {PNG} from 'pngjs';

export const getPng = async (url: string) => {
  const res = await axios.get(url);
  const image = new PNG().parse(res.data);
  return image;
};
