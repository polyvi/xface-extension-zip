/*
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements. See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership. The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied. See the License for the
 specific language governing permissions and limitations
 under the License.
 */

#import <cordova/CDVPlugin.h>

@interface XZipArchiveExt : CDVPlugin

/**
    实现对指定路径下的文件和文件夹进行压缩,通过回调返回压缩后的结果.
    @param arguments
    - 0 XJsCallback* callback
    - 1 filePath 待压缩的文件的路径
    - 2 dstfilePatn 压缩到指定路径（如果为空则压缩到当前目录）
    @param options 可选参数
    - 0 password 压缩文件使用密码
 */
- (void) zip:(CDVInvokedUrlCommand*)command;;

/**
    实现对指定路径下的多个文件和文件夹进行压缩,通过回调返回压缩后的结果.
    @param arguments
    - 0 XJsCallback* callback
    - 1 srcEntries 待压缩的源文件的路径数组（多个文件或者文件夹）
    - 2 dstZipFile 压缩到指定路径（如果为空则压缩到workspace）
    @param options 可选参数
    - 0 password 压缩文件使用密码
 */
- (void) zipFiles:(CDVInvokedUrlCommand*)command;;

/**
    实现对指定路径下的zip文件进行解压解压到指定路径,通过回调返回解压后的结果.
    @param arguments
    - 0 XJsCallback* callback
    - 1 zipFilePath 待解压的zip文件路径
    - 2 dstfilePatn 解压到指定路径（如果为空则解压到当前目录）
    @param options 可选参数
    - 0 password 解压文件使用密码
 */
- (void) unzip:(CDVInvokedUrlCommand*)command;;

@end
