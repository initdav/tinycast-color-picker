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

final class SamplingSession: NSObject, NSApplicationDelegate {
    private var result: Sample?
    var terminationCheck: (() -> Void)?

    func complete(with color: NSColor?) {
        guard result == nil else { return }
        result = color.map { sample(from: $0) } ?? Sample(status: "cancelled")

        // Never exit from NSColorSampler's callback: AppKit still has to unwind
        // the sampling session and release its screen-wide mouse capture.
        // Keep the run loop alive briefly for that cleanup, then quit through
        // NSApplication so its normal termination hooks also run.
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
            NSApplication.shared.terminate(nil)
        }
    }

    func applicationWillTerminate(_ notification: Notification) {
        terminationCheck?()
        if let result { emit(result) }
    }
}

let app = NSApplication.shared
let session = SamplingSession()
app.delegate = session
app.setActivationPolicy(.accessory)
app.finishLaunching()

// Exercise the real shutdown path without opening a screen-wide sampler.
if CommandLine.arguments.dropFirst().first == "--self-test-session" {
    let picked = CommandLine.arguments.last == "picked"
    var callbackReturned = false
    var cleanupRan = false
    session.terminationCheck = {
        precondition(callbackReturned && cleanupRan, "Terminated before sampler callback cleanup")
        FileHandle.standardError.write(Data("graceful termination after callback cleanup\n".utf8))
    }
    DispatchQueue.main.async {
        session.complete(with: picked ? NSColor(srgbRed: 1, green: 90.0 / 255, blue: 54.0 / 255, alpha: 1) : nil)
        callbackReturned = true
        DispatchQueue.main.async { cleanupRan = true }
    }
    app.run()
}

let sampler = NSColorSampler()

// Let the launcher's dismissal finish before macOS freezes the screen for sampling.
DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
    sampler.show { color in
        session.complete(with: color)
    }
}
app.run()
