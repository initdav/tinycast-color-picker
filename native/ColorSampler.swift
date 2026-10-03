import AppKit

struct Sample: Encodable {
    let status: String
    var red: Int? = nil
    var green: Int? = nil
    var blue: Int? = nil
}

func emit(_ sample: Sample) {
    guard let data = try? JSONEncoder().encode(sample) else { exit(1) }
    FileHandle.standardOutput.write(data)
    FileHandle.standardOutput.write(Data([10]))
}

func sample(from color: NSColor) -> Sample {
    // Screens can use Display P3 or extended ranges; CSS values must be converted to sRGB.
    guard let rgb = color.usingColorSpace(.sRGB) else {
        return Sample(status: "error")
    }
    func byte(_ channel: CGFloat) -> Int {
        Int((min(1, max(0, channel)) * 255).rounded())
    }
    return Sample(
        status: "picked",
        red: byte(rgb.redComponent),
        green: byte(rgb.greenComponent),
        blue: byte(rgb.blueComponent)
    )
}

// A noninteractive check of the compiled helper's color conversion and output protocol.
if CommandLine.arguments.dropFirst().first == "--self-test" {
    let samples = [
        sample(from: NSColor(srgbRed: 1, green: 90.0 / 255, blue: 54.0 / 255, alpha: 1)),
        sample(from: NSColor(srgbRed: 0, green: 0, blue: 0, alpha: 1)),
        sample(from: NSColor(srgbRed: 1, green: 1, blue: 1, alpha: 1)),
        sample(from: NSColor(srgbRed: -0.1, green: 1.1, blue: 0.5, alpha: 1)),
        sample(from: NSColor(displayP3Red: 1, green: 0, blue: 0, alpha: 1)),
        Sample(status: "cancelled")
    ]
    samples.forEach(emit)
    exit(0)
}

let app = NSApplication.shared
app.setActivationPolicy(.accessory)
app.finishLaunching()
let sampler = NSColorSampler()

// Let the launcher's dismissal finish before macOS freezes the screen for sampling.
DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
    sampler.show { color in
        if let color {
            emit(sample(from: color))
        } else {
            emit(Sample(status: "cancelled"))
        }
        exit(0)
    }
}
app.run()
