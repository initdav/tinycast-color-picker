import AppKit

// Reproducible extension artwork, drawn with AppKit rather than a downloaded asset.
let size = NSSize(width: 512, height: 512)
let image = NSImage(size: size)
image.lockFocus()
let bounds = NSRect(origin: .zero, size: size)
let background = NSBezierPath(roundedRect: bounds.insetBy(dx: 16, dy: 16), xRadius: 112, yRadius: 112)
NSGradient(colors: [
    NSColor(srgbRed: 0.19, green: 0.12, blue: 0.40, alpha: 1),
    NSColor(srgbRed: 0.09, green: 0.07, blue: 0.20, alpha: 1)
])!.draw(in: background, angle: -65)

let colors: [NSColor] = [
    NSColor(srgbRed: 1, green: 0.37, blue: 0.39, alpha: 1),
    NSColor(srgbRed: 1, green: 0.72, blue: 0.28, alpha: 1),
    NSColor(srgbRed: 0.26, green: 0.83, blue: 0.71, alpha: 1)
]
for (index, color) in colors.enumerated() {
    color.setFill()
    NSBezierPath(ovalIn: NSRect(x: 92 + index * 112, y: 83, width: 72, height: 72)).fill()
}

NSColor.white.setStroke()
let pipette = NSBezierPath()
pipette.lineWidth = 27
pipette.lineCapStyle = .round
pipette.lineJoinStyle = .round
pipette.move(to: NSPoint(x: 171, y: 212))
pipette.line(to: NSPoint(x: 182, y: 265))
pipette.line(to: NSPoint(x: 302, y: 385))
pipette.line(to: NSPoint(x: 351, y: 336))
pipette.line(to: NSPoint(x: 231, y: 216))
pipette.close()
pipette.stroke()
let collar = NSBezierPath()
collar.lineWidth = 33
collar.lineCapStyle = .round
collar.move(to: NSPoint(x: 280, y: 396))
collar.line(to: NSPoint(x: 366, y: 310))
collar.stroke()
NSColor.white.setFill()
NSBezierPath(ovalIn: NSRect(x: 326, y: 359, width: 63, height: 63)).fill()
image.unlockFocus()
let bitmap = NSBitmapImageRep(data: image.tiffRepresentation!)!
try bitmap.representation(using: .png, properties: [:])!.write(
    to: URL(fileURLWithPath: CommandLine.arguments[1]))
