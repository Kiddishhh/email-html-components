import AppKit
import Foundation
let root = CommandLine.arguments[1]
func save(_ image: CGImage, _ filename: String) throws {
    let rep = NSBitmapImageRep(cgImage: image)
    try rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: root + filename))
}
let photo = NSImage(contentsOfFile: root + "supplied-background.jpg")!
var bounds = CGRect(origin: .zero, size: photo.size)
let original = photo.cgImage(forProposedRect: &bounds, context: nil, hints: nil)!
try save(original.cropping(to: CGRect(x:302,y:4,width:600,height:858))!, "background-cropped.png")
let title = NSImage(contentsOfFile: root + "Only3Days.svg")!
let rep = NSBitmapImageRep(bitmapDataPlanes:nil,pixelsWide:1140,pixelsHigh:198,bitsPerSample:8,samplesPerPixel:4,hasAlpha:true,isPlanar:false,colorSpaceName:.deviceRGB,bytesPerRow:0,bitsPerPixel:0)!
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep:rep)
title.draw(in:NSRect(x:0,y:0,width:1140,height:198))
NSGraphicsContext.restoreGraphicsState()
try rep.representation(using:.png,properties:[:])!.write(to: URL(fileURLWithPath:root + "countdown-title.png"))
