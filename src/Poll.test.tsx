import "isomorphic-fetch";
import "jest-dom/extend-expect";
import nock from "nock";
import React from "react";
import { cleanup, render, wait } from "react-testing-library";

import { Poll, RestfulProvider } from "./index";

afterEach(() => {
  cleanup();
  nock.cleanAll();
});

describe("Poll", () => {
  describe("classic usage", () => {
    it("should call the url set in provider", async () => {
      nock("https://my-awesome-api.fake", {
        reqheaders: {
          prefer: "wait=60s;",
        },
      })
        .get("/")
        .reply(200, { data: "hello" }, { "x-polling-index": "1" });

      nock("https://my-awesome-api.fake", {
        reqheaders: {
          prefer: "wait=60s;index=1",
        },
      })
        .get("/")
        .reply(200, { data: "hello" }, { "x-polling-index": "2" });

      const children = jest.fn();
      children.mockReturnValue(<div />);

      render(
        <RestfulProvider base="https://my-awesome-api.fake">
          <Poll path="">{children}</Poll>
        </RestfulProvider>,
      );

      await wait(() => expect(children.mock.calls.length).toBe(2));
    });

    it("should compose the url with the base", async () => {
      nock("https://my-awesome-api.fake", {
        reqheaders: {
          prefer: "wait=60s;",
        },
      })
        .get("/plop")
        .reply(200, { data: "hello" }, { "x-polling-index": "1" });

      nock("https://my-awesome-api.fake", {
        reqheaders: {
          prefer: "wait=60s;index=1",
        },
      })
        .get("/plop")
        .reply(200, { data: "hello" }, { "x-polling-index": "2" });

      const children = jest.fn();
      children.mockReturnValue(<div />);

      render(
        <RestfulProvider base="https://my-awesome-api.fake">
          <Poll path="/plop">{children}</Poll>
        </RestfulProvider>,
      );

      await wait(() => expect(children.mock.calls.length).toBe(2));
    });

    it("should set loading to `true` on mount", async () => {
      nock("https://my-awesome-api.fake", {
        reqheaders: {
          prefer: "wait=60s;",
        },
      })
        .get("/")
        .reply(200, { data: "hello" }, { "x-polling-index": "1" });

      nock("https://my-awesome-api.fake", {
        reqheaders: {
          prefer: "wait=60s;index=1",
        },
      })
        .get("/")
        .reply(200, { data: "hello" }, { "x-polling-index": "2" });

      const children = jest.fn();
      children.mockReturnValue(<div />);

      render(
        <RestfulProvider base="https://my-awesome-api.fake">
          <Poll path="">{children}</Poll>
        </RestfulProvider>,
      );

      await wait(() => expect(children.mock.calls.length).toBe(2));
      expect(children.mock.calls[0][1].loading).toEqual(true);
    });

    it("should set loading to `false` on data", async () => {
      nock("https://my-awesome-api.fake", {
        reqheaders: {
          prefer: "wait=60s;",
        },
      })
        .get("/")
        .reply(200, { data: "hello" }, { "x-polling-index": "1" });

      nock("https://my-awesome-api.fake", {
        reqheaders: {
          prefer: "wait=60s;index=1",
        },
      })
        .get("/")
        .reply(200, { data: "hello" }, { "x-polling-index": "2" });

      const children = jest.fn();
      children.mockReturnValue(<div />);

      render(
        <RestfulProvider base="https://my-awesome-api.fake">
          <Poll path="">{children}</Poll>
        </RestfulProvider>,
      );

      await wait(() => expect(children.mock.calls.length).toBe(2));
      expect(children.mock.calls[1][1].loading).toEqual(false);
    });

    it("should send data on data", async () => {
      nock("https://my-awesome-api.fake", {
        reqheaders: {
          prefer: "wait=0s;",
        },
      })
        .get("/")
        .reply(200, { data: "hello" }, { "x-polling-index": "1" });

      nock("https://my-awesome-api.fake", {
        reqheaders: {
          prefer: "wait=0s;index=1",
        },
      })
        .get("/")
        .reply(200, { data: "hello" }, { "x-polling-index": "2" });

      const children = jest.fn();
      children.mockReturnValue(<div />);

      render(
        <RestfulProvider base="https://my-awesome-api.fake">
          <Poll path="" wait={0}>
            {children}
          </Poll>
        </RestfulProvider>,
      );

      await wait(() => expect(children.mock.calls.length).toBe(2));
      expect(children.mock.calls[1][0]).toEqual({ data: "hello" });
    });

    it("should update data if the response change", async () => {
      nock("https://my-awesome-api.fake", {
        reqheaders: {
          prefer: "wait=0s;",
        },
      })
        .get("/")
        .reply(200, { data: "hello" }, { "x-polling-index": "1" });

      nock("https://my-awesome-api.fake", {
        reqheaders: {
          prefer: "wait=0s;index=1",
        },
      })
        .get("/")
        .reply(200, { data: "hello you" }, { "x-polling-index": "2" });

      const children = jest.fn();
      children.mockReturnValue(<div />);

      render(
        <RestfulProvider base="https://my-awesome-api.fake">
          <Poll path="" wait={0}>
            {children}
          </Poll>
        </RestfulProvider>,
      );

      await wait(() => expect(children.mock.calls.length).toBe(3));
      expect(children.mock.calls[2][0]).toEqual({ data: "hello you" });
    });
  });

  describe("with error", () => {
    it("should set the `error` object properly", async () => {
      nock("https://my-awesome-api.fake")
        .get("/")
        .reply(401, { message: "You shall not pass!" });

      const children = jest.fn();
      children.mockReturnValue(<div />);

      render(
        <RestfulProvider base="https://my-awesome-api.fake">
          <Poll path="">{children}</Poll>
        </RestfulProvider>,
      );

      await wait(() => expect(children.mock.calls.length).toBe(2));
      expect(children.mock.calls[1][0]).toEqual(null);
      expect(children.mock.calls[1][1].error).toEqual({
        data: { message: "You shall not pass!" },
        message: "Failed to poll: 401 Unauthorized",
      });
    });

    it("should deal with non standard server error response (nginx style)", async () => {
      nock("https://my-awesome-api.fake")
        .get("/")
        .reply(200, "<html>404 - this is not a json!</html>", {
          "content-type": "application/json",
        });

      const children = jest.fn();
      children.mockReturnValue(<div />);

      render(
        <RestfulProvider base="https://my-awesome-api.fake">
          <Poll path="">{children}</Poll>
        </RestfulProvider>,
      );

      await wait(() => expect(children.mock.calls.length).toBe(2));
      expect(children.mock.calls[1][0]).toEqual(null);
      expect(children.mock.calls[1][1].error).toEqual({
        data:
          "invalid json response body at https://my-awesome-api.fake/ reason: Unexpected token < in JSON at position 0",
        message:
          "Failed to poll: 200 OK - invalid json response body at https://my-awesome-api.fake/ reason: Unexpected token < in JSON at position 0",
      });
    });

    it("should continue polling after an error", async () => {
      nock("https://my-awesome-api.fake")
        .get("/")
        .reply(504, "<html>504 Gateway Time-out</html>", {
          "content-type": "text/html",
        });

      nock("https://my-awesome-api.fake", {
        reqheaders: {
          prefer: "wait=0s;",
        },
      })
        .get("/")
        .reply(200, { data: "hello" }, { "x-polling-index": "1" });

      const children = jest.fn();
      children.mockReturnValue(<div />);

      render(
        <RestfulProvider base="https://my-awesome-api.fake">
          <Poll path="" wait={0}>
            {children}
          </Poll>
        </RestfulProvider>,
      );

      await wait(() => expect(children.mock.calls.length).toBe(3));

      // first res (error)
      expect(children.mock.calls[1][0]).toEqual(null);
      expect(children.mock.calls[1][1].error).toEqual({
        data: "<html>504 Gateway Time-out</html>",
        message: "Failed to poll: 504 Gateway Timeout",
      });

      // second res (success)
      expect(children.mock.calls[2][0]).toEqual({ data: "hello" });
      expect(children.mock.calls[2][1].error).toEqual(null);
    });

    it("should call the provider onError", async () => {
      nock("https://my-awesome-api.fake")
        .get("/")
        .reply(401, { message: "You shall not pass!" });

      const children = jest.fn();
      children.mockReturnValue(<div />);

      const onError = jest.fn();

      render(
        <RestfulProvider base="https://my-awesome-api.fake" onError={onError}>
          <Poll path="">{children}</Poll>
        </RestfulProvider>,
      );

      await wait(() => expect(children.mock.calls.length).toBe(2));
      expect(onError).toBeCalledWith({
        data: { message: "You shall not pass!" },
        message: "Failed to poll: 401 Unauthorized",
      });
    });

    it("should set the `error` object properly", async () => {
      nock("https://my-awesome-api.fake")
        .get("/")
        .reply(401, { message: "You shall not pass!" });

      const children = jest.fn();
      children.mockReturnValue(<div />);

      const onError = jest.fn();

      render(
        <RestfulProvider base="https://my-awesome-api.fake" onError={onError}>
          <Poll path="" localErrorOnly>
            {children}
          </Poll>
        </RestfulProvider>,
      );

      await wait(() => expect(children.mock.calls.length).toBe(2));
      expect(onError.mock.calls.length).toEqual(0);
    });
  });

  describe("with custom resolver", () => {
    it("should use the provider resolver", async () => {
      nock("https://my-awesome-api.fake")
        .get("/")
        .reply(200, { hello: "world" });

      const children = jest.fn();
      children.mockReturnValue(<div />);

      render(
        <RestfulProvider base="https://my-awesome-api.fake" resolve={data => ({ ...data, foo: "bar" })}>
          <Poll path="">{children}</Poll>
        </RestfulProvider>,
      );

      await wait(() => expect(children.mock.calls.length).toBe(2));
      expect(children.mock.calls[1][0]).toEqual({ hello: "world", foo: "bar" });
    });

    it("should transform data", async () => {
      nock("https://my-awesome-api.fake")
        .get("/")
        .reply(200, { hello: "world" });

      const children = jest.fn();
      children.mockReturnValue(<div />);

      render(
        <RestfulProvider base="https://my-awesome-api.fake">
          <Poll path="" resolve={data => ({ ...data, foo: "bar" })}>
            {children}
          </Poll>
        </RestfulProvider>,
      );

      await wait(() => expect(children.mock.calls.length).toBe(2));
      expect(children.mock.calls[1][0]).toEqual({ hello: "world", foo: "bar" });
    });

    it("should be able to consolidate data", async () => {
      nock("https://my-awesome-api.fake", {
        reqheaders: {
          prefer: "wait=0s;",
        },
      })
        .get("/")
        .reply(200, { data: "hello" }, { "x-polling-index": "1" });

      nock("https://my-awesome-api.fake", {
        reqheaders: {
          prefer: "wait=0s;index=1",
        },
      })
        .get("/")
        .reply(200, { data: " you" }, { "x-polling-index": "2" });

      const children = jest.fn();
      children.mockReturnValue(<div />);

      render(
        <RestfulProvider base="https://my-awesome-api.fake">
          <Poll
            path=""
            wait={0}
            resolve={(data, prevData) => ({
              data: (prevData || { data: "" }).data + data.data,
            })}
          >
            {children}
          </Poll>
        </RestfulProvider>,
      );

      await wait(() => expect(children.mock.calls.length).toBe(3));
      expect(children.mock.calls[2][0]).toEqual({ data: "hello you" });
    });
  });

  describe("with lazy", () => {
    it("should not fetch on mount", async () => {
      const children = jest.fn();
      children.mockReturnValue(<div />);

      render(
        <RestfulProvider base="https://my-awesome-api.fake">
          <Poll path="" lazy>
            {children}
          </Poll>
        </RestfulProvider>,
      );

      await wait(() => expect(children.mock.calls.length).toBe(1));
      expect(children.mock.calls[0][1].loading).toBe(false);
      expect(children.mock.calls[0][0]).toBe(null);
    });
  });

  describe("with base", () => {
    it("should override the base url", async () => {
      nock("https://my-awesome-api.fake")
        .get("/")
        .reply(200, { id: 1 });

      const children = jest.fn();
      children.mockReturnValue(<div />);

      render(
        <RestfulProvider base="https://not-here.fake">
          <Poll path="" base="https://my-awesome-api.fake">
            {children}
          </Poll>
        </RestfulProvider>,
      );

      await wait(() => expect(children.mock.calls.length).toBe(2));
      expect(children.mock.calls[1][1].loading).toEqual(false);
      expect(children.mock.calls[1][0]).toEqual({ id: 1 });
    });

    it("should override the base url and compose with the path", async () => {
      nock("https://my-awesome-api.fake")
        .get("/plop")
        .reply(200, { id: 1 });

      const children = jest.fn();
      children.mockReturnValue(<div />);

      render(
        <RestfulProvider base="https://not-here.fake">
          <Poll path="/plop" base="https://my-awesome-api.fake">
            {children}
          </Poll>
        </RestfulProvider>,
      );

      await wait(() => expect(children.mock.calls.length).toBe(2));
      expect(children.mock.calls[1][1].loading).toEqual(false);
      expect(children.mock.calls[1][0]).toEqual({ id: 1 });
    });
  });

  describe("with custom request options", () => {
    it("should add a custom header", async () => {
      nock("https://my-awesome-api.fake", { reqheaders: { foo: "bar" } })
        .get("/")
        .reply(200, { id: 1 });

      const children = jest.fn();
      children.mockReturnValue(<div />);

      render(
        <RestfulProvider base="https://my-awesome-api.fake">
          <Poll path="" requestOptions={{ headers: { foo: "bar" } }}>
            {children}
          </Poll>
        </RestfulProvider>,
      );

      await wait(() => expect(children.mock.calls.length).toBe(2));
      expect(children.mock.calls[1][1].loading).toEqual(false);
      expect(children.mock.calls[1][0]).toEqual({ id: 1 });
    });
  });
});
