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

#import "XZipArchiveExt.h"
#import "XZip.h"
#import <Cordova/CDVPluginResult.h>
#import <Cordova/NSArray+Comparisons.h>

#define PASSWORD_KEY                @"password"
#define FILE_SEPARATOR              @"/"


enum ZipError {
    FILE_NOT_EXIST = 1,
    COMPRESS_FILE_ERROR = 2,
    UNZIP_FILE_ERROR = 3,
    FILE_PATH_ERROR = 4,
    FILE_TYPE_ERROR = 5
};
typedef NSUInteger ZipError;

@implementation XZipArchiveExt

- (void) zip:(CDVInvokedUrlCommand*)command;
{
    NSDictionary *jsOptions = [command.arguments objectAtIndex:2];
    if([jsOptions isEqual:[NSNull null]])
    {
        jsOptions = nil;
    }

    NSString* filePath = nil;
    CDVPluginResult *result = nil;
    filePath = [command.arguments objectAtIndex:0];
    if (!filePath)
    {
        //不在workspace下
        [self sendErrorMessage:FILE_PATH_ERROR byCalllBack:command];
        return;
    }

    NSString* dstFilePath = nil;
    dstFilePath = [command.arguments objectAtIndex:1];
    if (!dstFilePath)
    {
        //不在workspace下
        [self sendErrorMessage:FILE_PATH_ERROR byCalllBack:command];
        return;
    }

    NSString* password = [jsOptions objectForKey:PASSWORD_KEY];
    NSFileManager* fileMrg = [NSFileManager defaultManager];
    BOOL isExisted = NO;
    BOOL isDirectory = NO;
    isExisted = [fileMrg fileExistsAtPath:filePath isDirectory:&isDirectory];
    if (!isExisted)
    {
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsInt:FILE_NOT_EXIST];
    }
    else
    {
        //创建好压缩文件所在的目标路径代表的文件夹
        [self createFolder:dstFilePath];
        if (isDirectory)//压缩文件夹
        {
            if ([XZip compressFolder:filePath To:dstFilePath withPassword:password])
            {
                result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
            }
            else
            {
                result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsInt:COMPRESS_FILE_ERROR];
            }
        }
        else//压缩文件
        {
            if ([XZip compressFile:filePath To:dstFilePath withPassword:password])
            {
                result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
            }
            else
            {
                result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsInt:COMPRESS_FILE_ERROR];
            }
        }
    }
    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

- (void) zipFiles:(CDVInvokedUrlCommand*)command;
{
    NSArray* paths = [command.arguments objectAtIndex:0];
    NSString* dstZipFile = [command.arguments objectAtIndex:1];
    NSDictionary *jsOptions = [command.arguments objectAtIndex:2];
    if([jsOptions isEqual:[NSNull null]])
    {
        jsOptions = nil;
    }
    NSString* password = [jsOptions objectForKey:PASSWORD_KEY];

    //check path有效性
    NSMutableArray* filePaths = [[NSMutableArray alloc] initWithCapacity:[paths count]];
    NSString* filePath = nil;
    NSFileManager* fileMrg = [NSFileManager defaultManager];
    BOOL isExisted = NO;
    BOOL isDirectory = NO;
    for(NSUInteger i = 0; i < [paths count]; i++)
    {
        filePath = [paths objectAtIndex:i];
        if (!filePath)
        {
            //不在workspace下
            [self sendErrorMessage:FILE_PATH_ERROR byCalllBack:command];
            return;
        }

        isExisted = [fileMrg fileExistsAtPath:filePath isDirectory:&isDirectory];
        if(!isExisted)
        {
            //源文件不存在
            [self sendErrorMessage:FILE_NOT_EXIST byCalllBack:command];
            return;
        }
        [filePaths addObject:filePath];
    }

    //ckeck dstZipFile有效性
    if (!dstZipFile)
    {
        //不在workspace下
        [self sendErrorMessage:FILE_PATH_ERROR byCalllBack:command];
        return;
    }
    //创建好dstZipFile的父目录
    [self createFolder:dstZipFile];

    CDVPluginResult *result = nil;
    if([XZip compressFiles:filePaths To:dstZipFile withPassword:password])
    {
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    }
    else
    {
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsInt:COMPRESS_FILE_ERROR];
    }
    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

- (void) unzip:(CDVInvokedUrlCommand*)command;
{
    NSDictionary *jsOptions = [command.arguments objectAtIndex:2];
    if([jsOptions isEqual:[NSNull null]])
    {
        jsOptions = nil;
    }
    CDVPluginResult *result = nil;
    NSString* zipFilePath = nil;
    zipFilePath = [command.arguments objectAtIndex:0];
    //zip文件路径非法不在workspace下
    if (!zipFilePath)
    {
        [self sendErrorMessage:FILE_PATH_ERROR byCalllBack:command];
        return;
    }

    NSString* dstFolderPath = nil;
    dstFolderPath = [command.arguments objectAtIndex:1];
    if (!dstFolderPath)
    {
        //不在workspace下
        [self sendErrorMessage:FILE_PATH_ERROR byCalllBack:command];
        return;
    }

    NSFileManager* fileMrg = [NSFileManager defaultManager];
    BOOL isExisted = NO;
    isExisted = [fileMrg fileExistsAtPath:zipFilePath];
    //zip文件不存在
    if (!isExisted)
    {
        result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsInt:FILE_NOT_EXIST];
    }
    else
    {
        //创建好解压文件所在的目标路径代表的文件夹
        [self createFolder:dstFolderPath];
        NSString* password = [jsOptions objectForKey:PASSWORD_KEY];
        if ([XZip unZipFile:zipFilePath To:dstFolderPath withPassword:password])
        {
            result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
        }
        else
        {
            result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsInt:UNZIP_FILE_ERROR];
        }
    }
    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

-(void) sendErrorMessage:(int)errorMessage byCalllBack:(CDVInvokedUrlCommand *)command
{
    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsInt:errorMessage];
    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

- (BOOL) createFolder:(NSString*)fullPath
{
    BOOL result = NO;
    NSString* path = fullPath;
    //文件应该有相应的文件名扩展,没有则处理成文件夹
    if([[path pathExtension] length] >0 )
    {
        //去掉filename
        path = [path stringByDeletingLastPathComponent];
    }
    NSFileManager* fileMrg = [NSFileManager defaultManager];
    result = [fileMrg createDirectoryAtPath:path withIntermediateDirectories:YES attributes:nil error:nil];
    return result;
}

@end
