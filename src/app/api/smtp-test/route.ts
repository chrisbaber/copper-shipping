import { NextResponse } from "next/server";
import * as dns from "dns";
import * as net from "net";
import * as tls from "tls";

export async function GET() {
  const results: Record<string, unknown> = {};
  const host = process.env.SMTP_HOST || "vda5000.is.cc";
  const ip = "74.50.89.208";

  // Test 1: DNS lookup of hostname
  try {
    const addr = await new Promise<string>((resolve, reject) => {
      dns.lookup(host, (err, address) => {
        if (err) reject(err);
        else resolve(address);
      });
    });
    results.dnsLookup = { success: true, address: addr };
  } catch (err) {
    results.dnsLookup = {
      success: false,
      error: (err as Error).message,
      code: (err as NodeJS.ErrnoException).code,
    };
  }

  // Test 2: DNS resolve4
  try {
    const addrs = await new Promise<string[]>((resolve, reject) => {
      dns.resolve4(host, (err, addresses) => {
        if (err) reject(err);
        else resolve(addresses);
      });
    });
    results.dnsResolve4 = { success: true, addresses: addrs };
  } catch (err) {
    results.dnsResolve4 = {
      success: false,
      error: (err as Error).message,
      code: (err as NodeJS.ErrnoException).code,
    };
  }

  // Test 3: DNS lookup of IP (should be instant, no DNS needed)
  try {
    const addr = await new Promise<string>((resolve, reject) => {
      dns.lookup(ip, (err, address) => {
        if (err) reject(err);
        else resolve(address);
      });
    });
    results.dnsLookupIp = { success: true, address: addr };
  } catch (err) {
    results.dnsLookupIp = {
      success: false,
      error: (err as Error).message,
      code: (err as NodeJS.ErrnoException).code,
    };
  }

  // Test 4: Raw TCP connection to IP:465
  try {
    await new Promise<void>((resolve, reject) => {
      const socket = net.createConnection({ host: ip, port: 465 }, () => {
        results.tcpConnect = { success: true };
        socket.destroy();
        resolve();
      });
      socket.setTimeout(5000);
      socket.on("timeout", () => {
        results.tcpConnect = { success: false, error: "timeout" };
        socket.destroy();
        reject(new Error("timeout"));
      });
      socket.on("error", (err) => {
        results.tcpConnect = { success: false, error: err.message };
        reject(err);
      });
    });
  } catch {
    // already set in handlers
  }

  // Test 5: TLS connection to IP:465
  try {
    await new Promise<void>((resolve, reject) => {
      const socket = tls.connect(
        { host: ip, port: 465, rejectAuthorized: false } as tls.ConnectionOptions,
        () => {
          results.tlsConnect = { success: true };
          socket.destroy();
          resolve();
        }
      );
      socket.setTimeout(5000);
      socket.on("timeout", () => {
        results.tlsConnect = { success: false, error: "timeout" };
        socket.destroy();
        reject(new Error("timeout"));
      });
      socket.on("error", (err) => {
        results.tlsConnect = { success: false, error: err.message };
        reject(err);
      });
    });
  } catch {
    // already set in handlers
  }

  return NextResponse.json({ host, ip, results });
}
