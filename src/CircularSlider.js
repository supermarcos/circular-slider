import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  angleToPosition,
  positionToAngle,
  AngleDescription,
  valueToAngle,
  angleToValue,
} from './circularGeometryHelpers';
import { arcPathWithRoundedEnds } from './svgPaths';

function CircularSlider(props) {
  const svgRef = useRef();

  const [handle1, setHandle1] = useState(props.handleValue1);
  const [handle2, setHandle2] = useState(props.handleValue2);

  const onMouseEnter = ev => {
    if (ev.buttons === 1) {
      // The left mouse button is pressed, act as though user clicked us
      onMouseDown(ev);
    }
  };

  const onMouseDown = ev => {
    const thisSvgRef = svgRef.current;
    if (thisSvgRef) {
      thisSvgRef.addEventListener('mousemove', processSelection);
      thisSvgRef.addEventListener('mouseleave', removeMouseListeners);
      thisSvgRef.addEventListener('mouseup', removeMouseListeners);
    }
    processSelection(ev);
  };

  const onTouchStart = ev => {
    const thisSvgRef = svgRef.current;
    if (thisSvgRef) {
      thisSvgRef.addEventListener('touchmove', processSelection);
      thisSvgRef.addEventListener('mouseleave', removeMouseListeners);
      thisSvgRef.addEventListener('touchend', removeMouseListeners);
    }
    processSelection(ev);
  };

  const removeMouseListeners = () => {
    const thisSvgRef = svgRef.current;
    if (thisSvgRef) {
      thisSvgRef.removeEventListener('mousemove', processSelection);
      thisSvgRef.removeEventListener('touchmove', processSelection);
      thisSvgRef.removeEventListener('mouseleave', removeMouseListeners);
      thisSvgRef.removeEventListener('mouseup', removeMouseListeners);
      thisSvgRef.removeEventListener('touchend', removeMouseListeners);
    }
  };

  const processSelection = ev => {
    const { size, maxValue, minValue, angleType, startAngle, endAngle, disabled, coerceToInt } = props;

    // let { handle1, handle2 } = props;

    if (!handle1) {
      // Read-only, don't bother doing calculations
      return;
    }
    const thisSvgRef = svgRef.current;
    if (!thisSvgRef) {
      return;
    }
    // Find the coordinates with respect to the SVG
    const svgPoint = thisSvgRef.createSVGPoint();
    const x = ev.clientX || ev.changedTouches[0].clientX;
    const y = ev.clientY || ev.changedTouches[0].clientY;
    svgPoint.x = x;
    svgPoint.y = y;
    const coordsInSvg = svgPoint.matrixTransform(thisSvgRef.getScreenCTM().inverse());

    const angle = positionToAngle(coordsInSvg, size, angleType);
    let value = angleToValue({
      angle,
      minValue,
      maxValue,
      startAngle,
      endAngle,
    });
    if (coerceToInt) {
      value = Math.round(value);
    }

    if (!disabled) {
      if (
        handle2 &&
        // make sure we're closer to handle 2 -- i.e. controlling handle2
        Math.abs(value - handle2) < Math.abs(value - handle1)
      ) {
        setHandle2(value);
      } else {
        setHandle1(value);
      }
    }
  };

  const {
    size,
    handleSize,
    maxValue,
    minValue,
    startAngle,
    endAngle,
    angleType,
    disabled,
    arcColor,
    arcBackgroundColor,
    outerShadow,
  } = props;
  const trackWidth = 4;
  const shadowWidth = 20;
  const trackInnerRadius = size / 2 - trackWidth - shadowWidth;
  const handle1Angle = valueToAngle({
    value: handle1,
    minValue,
    maxValue,
    startAngle,
    endAngle,
  });
  const handle2Angle =
    handle2 &&
    valueToAngle({
      value: handle2,
      minValue,
      maxValue,
      startAngle,
      endAngle,
    });
  const handle1Position = angleToPosition(
    { degree: handle1Angle, ...angleType },
    trackInnerRadius + trackWidth / 2,
    size,
  );
  const handle2Position =
    handle2Angle &&
    angleToPosition({ degree: handle2Angle, ...angleType }, trackInnerRadius + trackWidth / 2, size);

  const controllable = !disabled && Boolean(handle1);

  return (
    <svg
      width={size}
      height={size}
      ref={svgRef}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onMouseEnter={onMouseEnter}
      onClick={
        /* TODO: be smarter about this -- for example, we could run this through our
        calculation and determine how close we are to the arc, and use that to decide
        if we propagate the click. */
        ev => controllable && ev.stopPropagation()
      }
    >
      {/* Shadow */
      outerShadow && (
        <React.Fragment>
          <radialGradient id="outerShadow">
            <stop offset="90%" stopColor={arcColor} />
            <stop offset="100%" stopColor="white" />
          </radialGradient>

          <circle
            fill="none"
            stroke="url(#outerShadow)"
            cx={size / 2}
            cy={size / 2}
            // Subtract an extra pixel to ensure there's never any gap between slider and shadow
            r={trackInnerRadius + trackWidth + shadowWidth / 2 - 1}
            strokeWidth={shadowWidth}
          />
        </React.Fragment>
      )}

      {handle2Angle === undefined ? (
        /* One-handle mode */
        <React.Fragment>
          {/* Arc Background  */}
          <path
            d={arcPathWithRoundedEnds({
              startAngle: handle1Angle,
              endAngle,
              angleType,
              innerRadius: trackInnerRadius,
              thickness: trackWidth,
              svgSize: size,
              direction: angleType.direction,
            })}
            fill={arcBackgroundColor}
          />
          {/* Arc (render after background so it overlays it) */}
          <path
            d={arcPathWithRoundedEnds({
              startAngle,
              endAngle: handle1Angle,
              angleType,
              innerRadius: trackInnerRadius,
              thickness: trackWidth,
              svgSize: size,
              direction: angleType.direction,
            })}
            fill={arcColor}
          />
        </React.Fragment>
      ) : (
        /* Two-handle mode */
        <React.Fragment>
          {/* Arc Background Part 1  */}
          <path
            d={arcPathWithRoundedEnds({
              startAngle,
              endAngle: handle1Angle,
              angleType,
              innerRadius: trackInnerRadius,
              thickness: trackWidth,
              svgSize: size,
              direction: angleType.direction,
            })}
            fill={arcBackgroundColor}
          />
          {/* Arc Background Part 2  */}
          <path
            d={arcPathWithRoundedEnds({
              startAngle: handle2Angle,
              endAngle,
              angleType,
              innerRadius: trackInnerRadius,
              thickness: trackWidth,
              svgSize: size,
              direction: angleType.direction,
            })}
            fill={arcBackgroundColor}
          />
          {/* Arc (render after background so it overlays it) */}
          <path
            d={arcPathWithRoundedEnds({
              startAngle: handle1Angle,
              endAngle: handle2Angle,
              angleType,
              innerRadius: trackInnerRadius,
              thickness: trackWidth,
              svgSize: size,
              direction: angleType.direction,
            })}
            fill={arcColor}
          />
        </React.Fragment>
      )}

      {/* Handle 1 */
      controllable && (
        <React.Fragment>
          <filter id="handleShadow" x="-50%" y="-50%" width="16" height="16">
            <feOffset result="offOut" in="SourceGraphic" dx="0" dy="0" />
            <feColorMatrix
              result="matrixOut"
              in="offOut"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
            />
            <feGaussianBlur result="blurOut" in="matrixOut" stdDeviation="5" />
            <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
          </filter>
          <circle
            r={handleSize}
            cx={handle1Position.x}
            cy={handle1Position.y}
            fill="#ffffff"
            filter="url(#handleShadow)"
          />
        </React.Fragment>
      )}

      {/* Handle 2 */
      handle2Position && (
        <React.Fragment>
          <circle
            r={handleSize}
            cx={handle2Position.x}
            cy={handle2Position.y}
            fill="#ffffff"
            filter="url(#handleShadow)"
          />
        </React.Fragment>
      )}
    </svg>
  );
}
/*
function CircularSliderWithChildren(props) {
  const defaultProps = CircularSlider.defaultProps;
  const { size } = props;
  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
      }}
    >
      <CircularSlider {...props} />
      <div
        style={{
          position: 'absolute',
          top: '25%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '60px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {props.children}
      </div>
    </div>
  );
}
*/

CircularSlider.propTypes = {
  size: PropTypes.number,
  minValue: PropTypes.number,
  maxValue: PropTypes.number,
  startAngle: PropTypes.number, // 0 - 360 degrees
  endAngle: PropTypes.number, // 0 - 360 degrees
  angleType: PropTypes.any, // AngleDescription,
  handleSize: PropTypes.number,
  handleValue1: PropTypes.number,
  handleValue2: PropTypes.number,
  disabled: PropTypes.bool,
  arcColor: PropTypes.string,
  arcBackgroundColor: PropTypes.string,
  coerceToInt: PropTypes.bool,
  outerShadow: PropTypes.bool,
};
CircularSlider.defaultProps = {
  size: 200,
  minValue: 0,
  maxValue: 100,
  startAngle: 0,
  endAngle: 360,
  angleType: {
    direction: 'cw',
    axis: '-y',
  },
  handleSize: 8,
  arcBackgroundColor: '#aaa',
};

export default CircularSlider;
