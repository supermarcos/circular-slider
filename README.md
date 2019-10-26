# Circular Slider for React

### Basic usage

```js

  import { CircularSlider}  from '/CircularSlider';
  ...

  <CircularSlider
    size={150}
    minValue={0}
    maxValue={100}
    startAngle={0}
    endAngle={360}
    angleType={{
      direction: 'cw',
      axis: '-y',
    }}
    handleValue1={value1}
    handleValue2={value2}
    arcColor="#0D3958"
    arcBackgroundColor="#AAAAAA"
  />
```
