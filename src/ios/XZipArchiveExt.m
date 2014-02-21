
/*
 Copyright 2012-2013, Polyvi Inc. (http://polyvi.github.io/openxface)
 This program is distributed under the terms of the GNU General Public License.

 This file is part of xFace.

 xFace is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 xFace is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with xFace.  If not, see <http://www.gnu.org/licenses/>.
 */

#import "XZipArchiveExt.h"
#import "XZipArchiveExt_Privates.h"
#import <XFace/XApplication.h>
#import <XFace/XUtils.h>
#import <XFace/XFileUtils.h>
#import <XFace/XConstants.h>

#import <Cordova/CDVInvokedUrlCommand.h>
#import <Cordova/CDVPluginResult.h>
#import <Cordova/NSArray+Comparisons.h>

#import "CDVFile+XFile.h"

#define PASSWORD_KEY                @"password"

@interface  ZipArchive :NSObject
-(BOOL) CreateZipFile2:(NSString*) zipFile;
-(BOOL) CreateZipFile2:(NSString*) zipFile Password:(NSString*) password;
-(BOOL) addFileToZip:(NSString*) file newname:(NSString*) newname;
-(BOOL) CloseZipFile2;

-(BOOL) UnzipOpenFile:(NSString*) zipFile;
-(BOOL) UnzipOpenFile:(NSString*) zipFile Password:(NSString*) password;
-(BOOL) UnzipFileTo:(NSString*) path overWrite:(BOOL) overwrite;
-(BOOL) UnzipCloseFile;

@end

@implementation XZipArchiveExt

- (void) zip:(CDVInvokedUrlCommand*)command
{
    [self.commandDelegate runInBackground:^{
        NSDictionary *jsOptions = [command.arguments objectAtIndex:2 withDefault:nil];
        CDVFile *filePlugin = [self.commandDelegate getCommandInstance:@"File"];

        NSString* filePath = nil;
        CDVPluginResult *result = nil;
        filePath = [command.arguments objectAtIndex:0];
        filePath = [filePlugin resolveFilePath:filePath];
        if (!filePath)
        {
            [self sendErrorMessage:FILE_PATH_ERROR withCallbackId:command.callbackId];
            return;
        }

        NSString* dstFilePath = nil;
        dstFilePath = [command.arguments objectAtIndex:1];
        NSString* zipFilePath = [filePlugin resolveFilePath:dstFilePath];
        if (!zipFilePath)
        {
            [self sendErrorMessage:FILE_PATH_ERROR withCallbackId:command.callbackId];
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
            [XFileUtils createFolder:zipFilePath];
            if (isDirectory)//压缩文件夹
            {
                if ([self compressFolder:filePath To:zipFilePath withPassword:password])
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
                if ([self compressFile:filePath To:zipFilePath withPassword:password])
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
    }];
}

- (void) zipFiles:(CDVInvokedUrlCommand*)command
{
    [self.commandDelegate runInBackground:^{
        NSArray* paths = [command.arguments objectAtIndex:0];
        NSString* dstZipFile = [command.arguments objectAtIndex:1];
        NSDictionary *jsOptions = [command.arguments objectAtIndex:2 withDefault:nil];

        NSString* password = [jsOptions objectForKey:PASSWORD_KEY];
        CDVFile *filePlugin = [self.commandDelegate getCommandInstance:@"File"];

        //check path有效性
        NSMutableArray* filePaths = [[NSMutableArray alloc] initWithCapacity:[paths count]];
        NSString* filePath = nil;
        NSFileManager* fileMrg = [NSFileManager defaultManager];
        BOOL isExisted = NO;
        BOOL isDirectory = NO;
        for(NSUInteger i = 0; i < [paths count]; i++)
        {
            filePath = [paths objectAtIndex:i];
            filePath = [filePlugin resolveFilePath:filePath];
            if (!filePath)
            {
                //不在workspace下
                [self sendErrorMessage:FILE_PATH_ERROR withCallbackId:command.callbackId];
                return;
            }

            isExisted = [fileMrg fileExistsAtPath:filePath isDirectory:&isDirectory];
            if(!isExisted)
            {
                //源文件不存在
                [self sendErrorMessage:FILE_NOT_EXIST withCallbackId:command.callbackId];
                return;
            }
            [filePaths addObject:filePath];
        }

        //ckeck dstZipFile有效性
        dstZipFile = [filePlugin resolveFilePath:dstZipFile];
        if (!dstZipFile)
        {
            [self sendErrorMessage:FILE_PATH_ERROR withCallbackId:command.callbackId];
            return;
        }
        //创建好dstZipFile的父目录
        [XFileUtils createFolder:dstZipFile];

        CDVPluginResult *result = nil;
        if([self compressFiles:filePaths To:dstZipFile withPassword:password])
        {
            result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
        }
        else
        {
            result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsInt:COMPRESS_FILE_ERROR];
        }
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    }];
}

- (void) unzip:(CDVInvokedUrlCommand*)command
{
    [self.commandDelegate runInBackground:^{
        NSDictionary *jsOptions = [command.arguments objectAtIndex:2 withDefault:nil];
        CDVFile *filePlugin = [self.commandDelegate getCommandInstance:@"File"];

        CDVPluginResult *result = nil;
        NSString* zipFilePath = nil;
        zipFilePath = [command.arguments objectAtIndex:0];
        zipFilePath = [filePlugin resolveFilePath:zipFilePath];
        //zip文件路径非法不在workspace下
        if (!zipFilePath)
        {
            [self sendErrorMessage:FILE_PATH_ERROR withCallbackId:command.callbackId];
            return;
        }

        NSString* dstFolderPath = nil;
        dstFolderPath = [command.arguments objectAtIndex:1];
        dstFolderPath = [filePlugin resolveFilePath:dstFolderPath];
        if (!dstFolderPath)
        {
            //不在workspace下
            [self sendErrorMessage:FILE_PATH_ERROR withCallbackId:command.callbackId];
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
            [XFileUtils createFolder:dstFolderPath];
            NSString* password = [jsOptions objectForKey:PASSWORD_KEY];
            if ([self unZipFile:zipFilePath To:dstFolderPath withPassword:password])
            {
                result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
            }
            else
            {
                result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsInt:UNZIP_FILE_ERROR];
            }
        }
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    }];
}

#pragma mark Privates

- (BOOL) compressFile:(NSString*)filePath To:(NSString*)dstFilePath withPassword:(NSString*)password
{
    NSString* zipFilePath = dstFilePath;
    ZipArchive* zip = [[ZipArchive alloc] init];
    if ([zip CreateZipFile2:zipFilePath Password:password])
    {
        //求出file 相对filePath文件这级的路径 fileName
        NSString* fileName = [filePath lastPathComponent];
        return [zip addFileToZip:filePath newname:fileName] && [zip CloseZipFile2];
    }
    return NO;
}

- (BOOL) compressFiles:(NSMutableArray*)filePaths To:(NSString*)dstZipFile withPassword:(NSString*)password
{
    NSString* filePath = nil;
    NSFileManager* fileMrg = [NSFileManager defaultManager];
    BOOL isDirectory = NO;
    ZipArchive* zip = [[ZipArchive alloc] init];
    if ([zip CreateZipFile2:dstZipFile Password:password])
    {
        BOOL success = NO;
        for (NSUInteger i = 0; i < [filePaths count]; i++)
        {
            filePath = [filePaths objectAtIndex:i];
            [fileMrg fileExistsAtPath:filePath isDirectory:&isDirectory];

            if (isDirectory)
            {
                //add folder to zip
                success = [self addFileToZip:dstZipFile useZipArchive:zip atPath:filePath rootPath:filePath];
            }
            else
            {
                //add file to zip
                NSString* fileName = [filePath lastPathComponent];
                success = [zip addFileToZip:filePath newname:fileName];
            }

            //check add file to zip is success or error
            if (!success)
            {
                return NO;
            }
        }
        return success && [zip CloseZipFile2];
    }
    return NO;
}

- (BOOL) compressFolder:(NSString*)folderPath To:(NSString*)dstFilePath withPassword:(NSString*)password
{
    NSString* zipFilePath = dstFilePath;
    ZipArchive* zip = [[ZipArchive alloc] init];
    if ([zip CreateZipFile2:zipFilePath Password:password])
    {
        zipFilePath = [zipFilePath stringByDeletingLastPathComponent];
        BOOL success = [self addFileToZip:zipFilePath useZipArchive:zip atPath:folderPath rootPath:folderPath];
        return success && [zip CloseZipFile2];
    }
    return NO;
}

- (BOOL)addFileToZip:(NSString*)zipFilePath useZipArchive:(ZipArchive*)zip atPath: (NSString *)filePath rootPath:(NSString *)rootFilePath
{
    NSFileManager* fileMgr = [NSFileManager defaultManager];
    NSDirectoryEnumerator* directoryEnumerator = [fileMgr enumeratorAtPath:filePath];
    //空文件夹
    if(![directoryEnumerator nextObject])
    {
        NSString* fileName = [self getRelativeFileName:filePath withRootFilePath:rootFilePath];
        fileName = [fileName stringByAppendingString:FILE_SEPARATOR];
        return [zip addFileToZip:filePath newname:fileName];
    }
    else
    {
        //文件夹
        BOOL success = NO;
        NSArray* contents = [fileMgr contentsOfDirectoryAtPath:filePath error:nil];
        for (NSString* name in contents)
        {
            NSString* currentFile = [filePath stringByAppendingPathComponent:name];
            BOOL isDir = NO;
            [fileMgr fileExistsAtPath:currentFile isDirectory: &isDir];
            if (isDir)
            {
                //继续遍历文件夹,将文件加入zip文件
                success = [self addFileToZip:zipFilePath useZipArchive:zip atPath:currentFile rootPath:rootFilePath];
            }
            else
            {
                //求出相对于压缩文件所在根目录这级的 fileName
                NSString* fileName = [self getRelativeFileName:currentFile withRootFilePath:rootFilePath];
                success = [zip addFileToZip:currentFile newname:fileName];
            }

            if (!success)//发生错误，直接退出函数
            {
                return NO;
            }
        }
    }
    return YES;
}

- (BOOL) unZipFile:(NSString*)zipFilePath To:(NSString*)dstFilePath withPassword:(NSString*)password
{
    if (0 == [dstFilePath length])
    {
        dstFilePath = [zipFilePath stringByDeletingLastPathComponent];
    }

    ZipArchive* zip = [[ZipArchive alloc] init];
    if([zip UnzipOpenFile:zipFilePath Password:password])
    {
        BOOL success = [zip UnzipFileTo:dstFilePath overWrite:YES];
        return success && [zip UnzipCloseFile];
    }
    return NO;
}

- (NSString*) getRelativeFileName:(NSString*)currentFilePath withRootFilePath:(NSString*)rootFilePath
{
    rootFilePath = [rootFilePath stringByDeletingLastPathComponent];
    return  [currentFilePath substringFromIndex:[rootFilePath length]];
}

-(void) sendErrorMessage:(int)errorMessage withCallbackId:(NSString *)callbackId
{
    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsInt:errorMessage];
    [self.commandDelegate sendPluginResult:result callbackId:callbackId];
}

@end
