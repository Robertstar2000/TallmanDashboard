// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
// This module ports:
// - https://github.com/nodejs/node/blob/master/src/uv.cc
// - https://github.com/nodejs/node/blob/master/deps/uv
//
// See also: http://docs.libuv.org/en/v1.x/errors.html#error-constants
import { unreachable } from "../../_util/asserts.ts";
import { osType } from "../../_util/os.ts";
import { uvTranslateSysError } from "./_libuv_winerror.ts";
const codeToErrorWindows = [
    [-4093, ["E2BIG", "argument list too long"]],
    [-4092, ["EACCES", "permission denied"]],
    [-4091, ["EADDRINUSE", "address already in use"]],
    [-4090, ["EADDRNOTAVAIL", "address not available"]],
    [-4089, ["EAFNOSUPPORT", "address family not supported"]],
    [-4088, ["EAGAIN", "resource temporarily unavailable"]],
    [-3000, ["EAI_ADDRFAMILY", "address family not supported"]],
    [-3001, ["EAI_AGAIN", "temporary failure"]],
    [-3002, ["EAI_BADFLAGS", "bad ai_flags value"]],
    [-3013, ["EAI_BADHINTS", "invalid value for hints"]],
    [-3003, ["EAI_CANCELED", "request canceled"]],
    [-3004, ["EAI_FAIL", "permanent failure"]],
    [-3005, ["EAI_FAMILY", "ai_family not supported"]],
    [-3006, ["EAI_MEMORY", "out of memory"]],
    [-3007, ["EAI_NODATA", "no address"]],
    [-3008, ["EAI_NONAME", "unknown node or service"]],
    [-3009, ["EAI_OVERFLOW", "argument buffer overflow"]],
    [-3014, ["EAI_PROTOCOL", "resolved protocol is unknown"]],
    [-3010, ["EAI_SERVICE", "service not available for socket type"]],
    [-3011, ["EAI_SOCKTYPE", "socket type not supported"]],
    [-4084, ["EALREADY", "connection already in progress"]],
    [-4083, ["EBADF", "bad file descriptor"]],
    [-4082, ["EBUSY", "resource busy or locked"]],
    [-4081, ["ECANCELED", "operation canceled"]],
    [-4080, ["ECHARSET", "invalid Unicode character"]],
    [-4079, ["ECONNABORTED", "software caused connection abort"]],
    [-4078, ["ECONNREFUSED", "connection refused"]],
    [-4077, ["ECONNRESET", "connection reset by peer"]],
    [-4076, ["EDESTADDRREQ", "destination address required"]],
    [-4075, ["EEXIST", "file already exists"]],
    [-4074, ["EFAULT", "bad address in system call argument"]],
    [-4036, ["EFBIG", "file too large"]],
    [-4073, ["EHOSTUNREACH", "host is unreachable"]],
    [-4072, ["EINTR", "interrupted system call"]],
    [-4071, ["EINVAL", "invalid argument"]],
    [-4070, ["EIO", "i/o error"]],
    [-4069, ["EISCONN", "socket is already connected"]],
    [-4068, ["EISDIR", "illegal operation on a directory"]],
    [-4067, ["ELOOP", "too many symbolic links encountered"]],
    [-4066, ["EMFILE", "too many open files"]],
    [-4065, ["EMSGSIZE", "message too long"]],
    [-4064, ["ENAMETOOLONG", "name too long"]],
    [-4063, ["ENETDOWN", "network is down"]],
    [-4062, ["ENETUNREACH", "network is unreachable"]],
    [-4061, ["ENFILE", "file table overflow"]],
    [-4060, ["ENOBUFS", "no buffer space available"]],
    [-4059, ["ENODEV", "no such device"]],
    [-4058, ["ENOENT", "no such file or directory"]],
    [-4057, ["ENOMEM", "not enough memory"]],
    [-4056, ["ENONET", "machine is not on the network"]],
    [-4035, ["ENOPROTOOPT", "protocol not available"]],
    [-4055, ["ENOSPC", "no space left on device"]],
    [-4054, ["ENOSYS", "function not implemented"]],
    [-4053, ["ENOTCONN", "socket is not connected"]],
    [-4052, ["ENOTDIR", "not a directory"]],
    [-4051, ["ENOTEMPTY", "directory not empty"]],
    [-4050, ["ENOTSOCK", "socket operation on non-socket"]],
    [-4049, ["ENOTSUP", "operation not supported on socket"]],
    [-4048, ["EPERM", "operation not permitted"]],
    [-4047, ["EPIPE", "broken pipe"]],
    [-4046, ["EPROTO", "protocol error"]],
    [-4045, ["EPROTONOSUPPORT", "protocol not supported"]],
    [-4044, ["EPROTOTYPE", "protocol wrong type for socket"]],
    [-4034, ["ERANGE", "result too large"]],
    [-4043, ["EROFS", "read-only file system"]],
    [-4042, ["ESHUTDOWN", "cannot send after transport endpoint shutdown"]],
    [-4041, ["ESPIPE", "invalid seek"]],
    [-4040, ["ESRCH", "no such process"]],
    [-4039, ["ETIMEDOUT", "connection timed out"]],
    [-4038, ["ETXTBSY", "text file is busy"]],
    [-4037, ["EXDEV", "cross-device link not permitted"]],
    [-4094, ["UNKNOWN", "unknown error"]],
    [-4095, ["EOF", "end of file"]],
    [-4033, ["ENXIO", "no such device or address"]],
    [-4032, ["EMLINK", "too many links"]],
    [-4031, ["EHOSTDOWN", "host is down"]],
    [-4030, ["EREMOTEIO", "remote I/O error"]],
    [-4029, ["ENOTTY", "inappropriate ioctl for device"]],
    [-4028, ["EFTYPE", "inappropriate file type or format"]],
    [-4027, ["EILSEQ", "illegal byte sequence"]],
];
const errorToCodeWindows = codeToErrorWindows.map(([status, [error]]) => [error, status]);
const codeToErrorDarwin = [
    [-7, ["E2BIG", "argument list too long"]],
    [-13, ["EACCES", "permission denied"]],
    [-48, ["EADDRINUSE", "address already in use"]],
    [-49, ["EADDRNOTAVAIL", "address not available"]],
    [-47, ["EAFNOSUPPORT", "address family not supported"]],
    [-35, ["EAGAIN", "resource temporarily unavailable"]],
    [-3000, ["EAI_ADDRFAMILY", "address family not supported"]],
    [-3001, ["EAI_AGAIN", "temporary failure"]],
    [-3002, ["EAI_BADFLAGS", "bad ai_flags value"]],
    [-3013, ["EAI_BADHINTS", "invalid value for hints"]],
    [-3003, ["EAI_CANCELED", "request canceled"]],
    [-3004, ["EAI_FAIL", "permanent failure"]],
    [-3005, ["EAI_FAMILY", "ai_family not supported"]],
    [-3006, ["EAI_MEMORY", "out of memory"]],
    [-3007, ["EAI_NODATA", "no address"]],
    [-3008, ["EAI_NONAME", "unknown node or service"]],
    [-3009, ["EAI_OVERFLOW", "argument buffer overflow"]],
    [-3014, ["EAI_PROTOCOL", "resolved protocol is unknown"]],
    [-3010, ["EAI_SERVICE", "service not available for socket type"]],
    [-3011, ["EAI_SOCKTYPE", "socket type not supported"]],
    [-37, ["EALREADY", "connection already in progress"]],
    [-9, ["EBADF", "bad file descriptor"]],
    [-16, ["EBUSY", "resource busy or locked"]],
    [-89, ["ECANCELED", "operation canceled"]],
    [-4080, ["ECHARSET", "invalid Unicode character"]],
    [-53, ["ECONNABORTED", "software caused connection abort"]],
    [-61, ["ECONNREFUSED", "connection refused"]],
    [-54, ["ECONNRESET", "connection reset by peer"]],
    [-39, ["EDESTADDRREQ", "destination address required"]],
    [-17, ["EEXIST", "file already exists"]],
    [-14, ["EFAULT", "bad address in system call argument"]],
    [-27, ["EFBIG", "file too large"]],
    [-65, ["EHOSTUNREACH", "host is unreachable"]],
    [-4, ["EINTR", "interrupted system call"]],
    [-22, ["EINVAL", "invalid argument"]],
    [-5, ["EIO", "i/o error"]],
    [-56, ["EISCONN", "socket is already connected"]],
    [-21, ["EISDIR", "illegal operation on a directory"]],
    [-62, ["ELOOP", "too many symbolic links encountered"]],
    [-24, ["EMFILE", "too many open files"]],
    [-40, ["EMSGSIZE", "message too long"]],
    [-63, ["ENAMETOOLONG", "name too long"]],
    [-50, ["ENETDOWN", "network is down"]],
    [-51, ["ENETUNREACH", "network is unreachable"]],
    [-23, ["ENFILE", "file table overflow"]],
    [-55, ["ENOBUFS", "no buffer space available"]],
    [-19, ["ENODEV", "no such device"]],
    [-2, ["ENOENT", "no such file or directory"]],
    [-12, ["ENOMEM", "not enough memory"]],
    [-4056, ["ENONET", "machine is not on the network"]],
    [-42, ["ENOPROTOOPT", "protocol not available"]],
    [-28, ["ENOSPC", "no space left on device"]],
    [-78, ["ENOSYS", "function not implemented"]],
    [-57, ["ENOTCONN", "socket is not connected"]],
    [-20, ["ENOTDIR", "not a directory"]],
    [-66, ["ENOTEMPTY", "directory not empty"]],
    [-38, ["ENOTSOCK", "socket operation on non-socket"]],
    [-45, ["ENOTSUP", "operation not supported on socket"]],
    [-1, ["EPERM", "operation not permitted"]],
    [-32, ["EPIPE", "broken pipe"]],
    [-100, ["EPROTO", "protocol error"]],
    [-43, ["EPROTONOSUPPORT", "protocol not supported"]],
    [-41, ["EPROTOTYPE", "protocol wrong type for socket"]],
    [-34, ["ERANGE", "result too large"]],
    [-30, ["EROFS", "read-only file system"]],
    [-58, ["ESHUTDOWN", "cannot send after transport endpoint shutdown"]],
    [-29, ["ESPIPE", "invalid seek"]],
    [-3, ["ESRCH", "no such process"]],
    [-60, ["ETIMEDOUT", "connection timed out"]],
    [-26, ["ETXTBSY", "text file is busy"]],
    [-18, ["EXDEV", "cross-device link not permitted"]],
    [-4094, ["UNKNOWN", "unknown error"]],
    [-4095, ["EOF", "end of file"]],
    [-6, ["ENXIO", "no such device or address"]],
    [-31, ["EMLINK", "too many links"]],
    [-64, ["EHOSTDOWN", "host is down"]],
    [-4030, ["EREMOTEIO", "remote I/O error"]],
    [-25, ["ENOTTY", "inappropriate ioctl for device"]],
    [-79, ["EFTYPE", "inappropriate file type or format"]],
    [-92, ["EILSEQ", "illegal byte sequence"]],
];
const errorToCodeDarwin = codeToErrorDarwin.map(([status, [code]]) => [code, status]);
const codeToErrorLinux = [
    [-7, ["E2BIG", "argument list too long"]],
    [-13, ["EACCES", "permission denied"]],
    [-98, ["EADDRINUSE", "address already in use"]],
    [-99, ["EADDRNOTAVAIL", "address not available"]],
    [-97, ["EAFNOSUPPORT", "address family not supported"]],
    [-11, ["EAGAIN", "resource temporarily unavailable"]],
    [-3000, ["EAI_ADDRFAMILY", "address family not supported"]],
    [-3001, ["EAI_AGAIN", "temporary failure"]],
    [-3002, ["EAI_BADFLAGS", "bad ai_flags value"]],
    [-3013, ["EAI_BADHINTS", "invalid value for hints"]],
    [-3003, ["EAI_CANCELED", "request canceled"]],
    [-3004, ["EAI_FAIL", "permanent failure"]],
    [-3005, ["EAI_FAMILY", "ai_family not supported"]],
    [-3006, ["EAI_MEMORY", "out of memory"]],
    [-3007, ["EAI_NODATA", "no address"]],
    [-3008, ["EAI_NONAME", "unknown node or service"]],
    [-3009, ["EAI_OVERFLOW", "argument buffer overflow"]],
    [-3014, ["EAI_PROTOCOL", "resolved protocol is unknown"]],
    [-3010, ["EAI_SERVICE", "service not available for socket type"]],
    [-3011, ["EAI_SOCKTYPE", "socket type not supported"]],
    [-114, ["EALREADY", "connection already in progress"]],
    [-9, ["EBADF", "bad file descriptor"]],
    [-16, ["EBUSY", "resource busy or locked"]],
    [-125, ["ECANCELED", "operation canceled"]],
    [-4080, ["ECHARSET", "invalid Unicode character"]],
    [-103, ["ECONNABORTED", "software caused connection abort"]],
    [-111, ["ECONNREFUSED", "connection refused"]],
    [-104, ["ECONNRESET", "connection reset by peer"]],
    [-89, ["EDESTADDRREQ", "destination address required"]],
    [-17, ["EEXIST", "file already exists"]],
    [-14, ["EFAULT", "bad address in system call argument"]],
    [-27, ["EFBIG", "file too large"]],
    [-113, ["EHOSTUNREACH", "host is unreachable"]],
    [-4, ["EINTR", "interrupted system call"]],
    [-22, ["EINVAL", "invalid argument"]],
    [-5, ["EIO", "i/o error"]],
    [-106, ["EISCONN", "socket is already connected"]],
    [-21, ["EISDIR", "illegal operation on a directory"]],
    [-40, ["ELOOP", "too many symbolic links encountered"]],
    [-24, ["EMFILE", "too many open files"]],
    [-90, ["EMSGSIZE", "message too long"]],
    [-36, ["ENAMETOOLONG", "name too long"]],
    [-100, ["ENETDOWN", "network is down"]],
    [-101, ["ENETUNREACH", "network is unreachable"]],
    [-23, ["ENFILE", "file table overflow"]],
    [-105, ["ENOBUFS", "no buffer space available"]],
    [-19, ["ENODEV", "no such device"]],
    [-2, ["ENOENT", "no such file or directory"]],
    [-12, ["ENOMEM", "not enough memory"]],
    [-64, ["ENONET", "machine is not on the network"]],
    [-92, ["ENOPROTOOPT", "protocol not available"]],
    [-28, ["ENOSPC", "no space left on device"]],
    [-38, ["ENOSYS", "function not implemented"]],
    [-107, ["ENOTCONN", "socket is not connected"]],
    [-20, ["ENOTDIR", "not a directory"]],
    [-39, ["ENOTEMPTY", "directory not empty"]],
    [-88, ["ENOTSOCK", "socket operation on non-socket"]],
    [-95, ["ENOTSUP", "operation not supported on socket"]],
    [-1, ["EPERM", "operation not permitted"]],
    [-32, ["EPIPE", "broken pipe"]],
    [-71, ["EPROTO", "protocol error"]],
    [-93, ["EPROTONOSUPPORT", "protocol not supported"]],
    [-91, ["EPROTOTYPE", "protocol wrong type for socket"]],
    [-34, ["ERANGE", "result too large"]],
    [-30, ["EROFS", "read-only file system"]],
    [-108, ["ESHUTDOWN", "cannot send after transport endpoint shutdown"]],
    [-29, ["ESPIPE", "invalid seek"]],
    [-3, ["ESRCH", "no such process"]],
    [-110, ["ETIMEDOUT", "connection timed out"]],
    [-26, ["ETXTBSY", "text file is busy"]],
    [-18, ["EXDEV", "cross-device link not permitted"]],
    [-4094, ["UNKNOWN", "unknown error"]],
    [-4095, ["EOF", "end of file"]],
    [-6, ["ENXIO", "no such device or address"]],
    [-31, ["EMLINK", "too many links"]],
    [-112, ["EHOSTDOWN", "host is down"]],
    [-121, ["EREMOTEIO", "remote I/O error"]],
    [-25, ["ENOTTY", "inappropriate ioctl for device"]],
    [-4028, ["EFTYPE", "inappropriate file type or format"]],
    [-84, ["EILSEQ", "illegal byte sequence"]],
];
const errorToCodeLinux = codeToErrorLinux.map(([status, [code]]) => [code, status]);
const codeToErrorFreebsd = [
    [-7, ["E2BIG", "argument list too long"]],
    [-13, ["EACCES", "permission denied"]],
    [-48, ["EADDRINUSE", "address already in use"]],
    [-49, ["EADDRNOTAVAIL", "address not available"]],
    [-47, ["EAFNOSUPPORT", "address family not supported"]],
    [-35, ["EAGAIN", "resource temporarily unavailable"]],
    [-3000, ["EAI_ADDRFAMILY", "address family not supported"]],
    [-3001, ["EAI_AGAIN", "temporary failure"]],
    [-3002, ["EAI_BADFLAGS", "bad ai_flags value"]],
    [-3013, ["EAI_BADHINTS", "invalid value for hints"]],
    [-3003, ["EAI_CANCELED", "request canceled"]],
    [-3004, ["EAI_FAIL", "permanent failure"]],
    [-3005, ["EAI_FAMILY", "ai_family not supported"]],
    [-3006, ["EAI_MEMORY", "out of memory"]],
    [-3007, ["EAI_NODATA", "no address"]],
    [-3008, ["EAI_NONAME", "unknown node or service"]],
    [-3009, ["EAI_OVERFLOW", "argument buffer overflow"]],
    [-3014, ["EAI_PROTOCOL", "resolved protocol is unknown"]],
    [-3010, ["EAI_SERVICE", "service not available for socket type"]],
    [-3011, ["EAI_SOCKTYPE", "socket type not supported"]],
    [-37, ["EALREADY", "connection already in progress"]],
    [-9, ["EBADF", "bad file descriptor"]],
    [-16, ["EBUSY", "resource busy or locked"]],
    [-85, ["ECANCELED", "operation canceled"]],
    [-4080, ["ECHARSET", "invalid Unicode character"]],
    [-53, ["ECONNABORTED", "software caused connection abort"]],
    [-61, ["ECONNREFUSED", "connection refused"]],
    [-54, ["ECONNRESET", "connection reset by peer"]],
    [-39, ["EDESTADDRREQ", "destination address required"]],
    [-17, ["EEXIST", "file already exists"]],
    [-14, ["EFAULT", "bad address in system call argument"]],
    [-27, ["EFBIG", "file too large"]],
    [-65, ["EHOSTUNREACH", "host is unreachable"]],
    [-4, ["EINTR", "interrupted system call"]],
    [-22, ["EINVAL", "invalid argument"]],
    [-5, ["EIO", "i/o error"]],
    [-56, ["EISCONN", "socket is already connected"]],
    [-21, ["EISDIR", "illegal operation on a directory"]],
    [-62, ["ELOOP", "too many symbolic links encountered"]],
    [-24, ["EMFILE", "too many open files"]],
    [-40, ["EMSGSIZE", "message too long"]],
    [-63, ["ENAMETOOLONG", "name too long"]],
    [-50, ["ENETDOWN", "network is down"]],
    [-51, ["ENETUNREACH", "network is unreachable"]],
    [-23, ["ENFILE", "file table overflow"]],
    [-55, ["ENOBUFS", "no buffer space available"]],
    [-19, ["ENODEV", "no such device"]],
    [-2, ["ENOENT", "no such file or directory"]],
    [-12, ["ENOMEM", "not enough memory"]],
    [-4056, ["ENONET", "machine is not on the network"]],
    [-42, ["ENOPROTOOPT", "protocol not available"]],
    [-28, ["ENOSPC", "no space left on device"]],
    [-78, ["ENOSYS", "function not implemented"]],
    [-57, ["ENOTCONN", "socket is not connected"]],
    [-20, ["ENOTDIR", "not a directory"]],
    [-66, ["ENOTEMPTY", "directory not empty"]],
    [-38, ["ENOTSOCK", "socket operation on non-socket"]],
    [-45, ["ENOTSUP", "operation not supported on socket"]],
    [-84, ["EOVERFLOW", "value too large for defined data type"]],
    [-1, ["EPERM", "operation not permitted"]],
    [-32, ["EPIPE", "broken pipe"]],
    [-92, ["EPROTO", "protocol error"]],
    [-43, ["EPROTONOSUPPORT", "protocol not supported"]],
    [-41, ["EPROTOTYPE", "protocol wrong type for socket"]],
    [-34, ["ERANGE", "result too large"]],
    [-30, ["EROFS", "read-only file system"]],
    [-58, ["ESHUTDOWN", "cannot send after transport endpoint shutdown"]],
    [-29, ["ESPIPE", "invalid seek"]],
    [-3, ["ESRCH", "no such process"]],
    [-60, ["ETIMEDOUT", "connection timed out"]],
    [-26, ["ETXTBSY", "text file is busy"]],
    [-18, ["EXDEV", "cross-device link not permitted"]],
    [-4094, ["UNKNOWN", "unknown error"]],
    [-4095, ["EOF", "end of file"]],
    [-6, ["ENXIO", "no such device or address"]],
    [-31, ["EMLINK", "too many links"]],
    [-64, ["EHOSTDOWN", "host is down"]],
    [-4030, ["EREMOTEIO", "remote I/O error"]],
    [-25, ["ENOTTY", "inappropriate ioctl for device"]],
    [-79, ["EFTYPE", "inappropriate file type or format"]],
    [-86, ["EILSEQ", "illegal byte sequence"]],
    [-44, ["ESOCKTNOSUPPORT", "socket type not supported"]],
];
const errorToCodeFreebsd = codeToErrorFreebsd.map(([status, [code]]) => [code, status]);
export const errorMap = new Map(osType === "windows"
    ? codeToErrorWindows
    : osType === "darwin"
        ? codeToErrorDarwin
        : osType === "linux"
            ? codeToErrorLinux
            : osType === "freebsd"
                ? codeToErrorFreebsd
                : unreachable());
export const codeMap = new Map(osType === "windows"
    ? errorToCodeWindows
    : osType === "darwin"
        ? errorToCodeDarwin
        : osType === "linux"
            ? errorToCodeLinux
            : osType === "freebsd"
                ? errorToCodeFreebsd
                : unreachable());
export function mapSysErrnoToUvErrno(sysErrno) {
    var _a;
    if (osType === "windows") {
        const code = uvTranslateSysError(sysErrno);
        return (_a = codeMap.get(code)) !== null && _a !== void 0 ? _a : -sysErrno;
    }
    else {
        return -sysErrno;
    }
}
export const UV_EAI_MEMORY = codeMap.get("EAI_MEMORY");
export const UV_EBADF = codeMap.get("EBADF");
export const UV_EEXIST = codeMap.get("EEXIST");
export const UV_EINVAL = codeMap.get("EINVAL");
export const UV_ENOENT = codeMap.get("ENOENT");
export const UV_ENOTSOCK = codeMap.get("ENOTSOCK");
export const UV_UNKNOWN = codeMap.get("UNKNOWN");
