import * as tf from '@tensorflow/tfjs';
let model: tf.LayersModel | null = null;

export async function loadModel(){
  if (model) return model;
  try {
    model = await tf.loadLayersModel('/model/model.json');
  } catch {
    // Fallback: MLP simple
    const m = tf.sequential();
    m.add(tf.layers.dense({ inputShape:[7], units:8, activation:'relu' }));
    m.add(tf.layers.dense({ units:1, activation:'sigmoid' }));
    m.compile({ optimizer:'adam', loss:'binaryCrossentropy' });
    model = m;
  }
  return model!;
}

export async function predictRisk(features:number[]){
  const m = await loadModel();
  const pred = m.predict(tf.tensor2d([features])) as tf.Tensor;
  const risk = (await pred.data())[0]; // 0..1
  return risk;
}

export function categorize(risk:number, t={low:0.33, high:0.66}){
  return risk < t.low ? 'low' : risk < t.high ? 'med' : 'high';
}
