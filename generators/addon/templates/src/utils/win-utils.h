#pragma once

#define WIN32_LEAN_AND_MEAN
#include <Windows.h>

#include <vector>
#include <iostream>
#include <string>

EXTERN_C IMAGE_DOS_HEADER __ImageBase;

static const wchar_t k_natvieDelimiter = '\\';

namespace utils
{
inline std::wstring toNativeFullPath(const std::wstring &path)
{
    std::wstring fullPath;
    std::vector<wchar_t> buffer;
    buffer.resize(MAX_PATH);
    wchar_t *fileName = 0;
    DWORD retLen = GetFullPathNameW((wchar_t *)path.c_str(), buffer.size(), buffer.data(), &fileName);
    if (retLen > (DWORD)MAX_PATH)
    {
        buffer.resize(retLen);
        retLen = GetFullPathNameW((wchar_t *)path.c_str(), buffer.size(), buffer.data(), &fileName);
    }
    if (retLen != 0)
        fullPath.assign(buffer.data(), retLen);
    if (!path.empty() && path.at(path.size() - 1) == ' ')
        fullPath.push_back(' ');
    if (fullPath != L"/" && fullPath.size() > 0 && fullPath[fullPath.size() - 1] == k_natvieDelimiter)
        fullPath = fullPath.substr(0, fullPath.size() - 1);
    return fullPath;
}

inline std::wstring currentModulePath()
{
    WCHAR DllPath[MAX_PATH] = {0};
    GetModuleFileNameW((HINSTANCE)&__ImageBase, DllPath, _countof(DllPath));
    return toNativeFullPath(DllPath);
}

inline std::wstring getParentPath(const std::wstring &filePath)
{
    std::wstring parentPath = filePath;
    size_t lastSepartor = filePath.find_last_of('\\');
    parentPath.erase(lastSepartor);
    return parentPath;
}

inline std::wstring fromMultiByte(UINT codePage, const char *str, int size /*= -1*/)
{
    std::wstring wstr;
    if (size < 0)
    {
        size = (int)strlen(str);
    }
    int bytesNeed = MultiByteToWideChar(codePage, 0, str, size, 0, 0);
    wstr.resize(bytesNeed);
    MultiByteToWideChar(codePage, 0, str, size, const_cast<wchar_t *>(wstr.c_str()), bytesNeed);
    return wstr;
}

inline std::string toMultiByte(UINT codePage, const wchar_t *wstr, int size /*= -1*/)
{

    std::string str;
    if (size < 0)
    {
        size = (int)wcslen(wstr);
    }
    int bytesNeed = WideCharToMultiByte(codePage, NULL, wstr, size, NULL, 0, NULL, FALSE);
    str.resize(bytesNeed);
    WideCharToMultiByte(codePage, NULL, wstr, size, const_cast<char *>(str.c_str()), bytesNeed, NULL, FALSE);
    return str;
}

inline std::wstring fromUtf8(const char *str, int size /*= -1*/)
{
    return fromMultiByte(CP_UTF8, str, size);
}

inline std::wstring fromUtf8(const std::string &str)
{
    return fromUtf8(str.c_str(), str.length());
}

inline std::wstring fromLocal8Bit(const char *str, int size /*= -1*/)
{
    return fromMultiByte(CP_ACP, str, size);
}

inline std::wstring fromLocal8Bit(const std::string &str)
{
    return fromLocal8Bit(str.c_str(), str.length());
}

inline std::string toLocal8Bit(const wchar_t *wstr, int size /*= -1*/)
{
    return toMultiByte(CP_ACP, wstr, size);
}

inline std::string toLocal8Bit(const std::wstring &str)
{
    return toLocal8Bit(str.c_str(), str.length());
}

inline std::string toUtf8(const wchar_t *wstr, int size /*= -1*/)
{
    return toMultiByte(CP_UTF8, wstr, size);
}

inline std::string toUtf8(const std::wstring &str)
{
    return toUtf8(str.c_str(), str.length());
}

inline std::string utf8ToLocal8Bit(const std::string &str)
{
    return toLocal8Bit(fromUtf8(str));
}

inline std::string local8BitToUtf8(const std::string &str)
{
    return toUtf8(fromLocal8Bit(str));
}
}; // namespace utils