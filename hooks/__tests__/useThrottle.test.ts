import { renderHook, act } from "@testing-library/react";
import { useThrottle } from "../useThrottle";

describe("useThrottle", () => {
  let dateNowSpy: jest.SpyInstance;
  let currentTime: number;

  beforeEach(() => {
    currentTime = 1000000;
    dateNowSpy = jest.spyOn(Date, "now");
    dateNowSpy.mockImplementation(() => currentTime);
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
  });

  it("should call callback immediately on first invocation", () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useThrottle(callback, 500));

    act(() => {
      result.current();
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should throttle subsequent calls within delay period", () => {
    const callback = jest.fn();

    const { result } = renderHook(() => useThrottle(callback, 500));

    act(() => {
      currentTime = 1000000;
      result.current();
    });

    expect(callback).toHaveBeenCalledTimes(1);

    act(() => {
      currentTime = 1000100;
      result.current();
    });

    expect(callback).toHaveBeenCalledTimes(1);

    act(() => {
      currentTime = 1000300;
      result.current();
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should allow callback after delay period has passed", () => {
    const callback = jest.fn();

    const { result } = renderHook(() => useThrottle(callback, 500));

    act(() => {
      currentTime = 1000000;
      result.current();
    });

    expect(callback).toHaveBeenCalledTimes(1);

    act(() => {
      currentTime = 1000500;
      result.current();
    });

    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("should pass arguments to callback", () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useThrottle(callback, 500));

    act(() => {
      result.current("arg1", "arg2", 123);
    });

    expect(callback).toHaveBeenCalledWith("arg1", "arg2", 123);
  });

  it("should update callback reference without recreating throttled function", () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();

    const { result, rerender } = renderHook(
      ({ cb, delay }) => useThrottle(cb, delay),
      { initialProps: { cb: callback1, delay: 500 } },
    );

    act(() => {
      currentTime = 1000000;
      result.current();
    });

    expect(callback1).toHaveBeenCalledTimes(1);

    rerender({ cb: callback2, delay: 500 });

    act(() => {
      currentTime = 1000500;
      result.current();
    });

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  it("should handle rapid successive calls correctly", () => {
    const callback = jest.fn();

    const { result } = renderHook(() => useThrottle(callback, 1000));

    act(() => {
      currentTime = 1000000;
      result.current();
      result.current();
      result.current();
      result.current();
    });

    expect(callback).toHaveBeenCalledTimes(1);

    act(() => {
      currentTime = 1001000;
      result.current();
      result.current();
    });

    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("should work with different delay values", () => {
    const callback = jest.fn();

    const { result } = renderHook(() => useThrottle(callback, 200));

    act(() => {
      currentTime = 1000000;
      result.current();
    });

    expect(callback).toHaveBeenCalledTimes(1);

    act(() => {
      currentTime = 1000100;
      result.current();
    });

    expect(callback).toHaveBeenCalledTimes(1);

    act(() => {
      currentTime = 1000200;
      result.current();
    });

    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("should handle edge case where timeSinceLastCall equals delay", () => {
    const callback = jest.fn();

    const { result } = renderHook(() => useThrottle(callback, 500));

    act(() => {
      currentTime = 1000;
      result.current();
    });

    expect(callback).toHaveBeenCalledTimes(1);

    act(() => {
      currentTime = 1500;
      result.current();
    });

    expect(callback).toHaveBeenCalledTimes(2);
  });
});
