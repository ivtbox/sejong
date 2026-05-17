import { useEffect, useState, useRef } from "react";
import { RotateCcw } from "lucide-react";

interface Student {
  name: string;
  status: string;
  studentId: string;
  birthDate: string;
}

interface QRModalProps {
  student: Student;
  onClose: () => void;
}

const REFRESH_INTERVAL = 59;
const SWIPE_THRESHOLD = 80;

export default function QRModal({ student, onClose }: QRModalProps) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [spinning, setSpinning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? REFRESH_INTERVAL : prev - 1));
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  function handleRefresh() {
    if (spinning) return;
    setCountdown(REFRESH_INTERVAL);
    setSpinning(true);
    setTimeout(() => setSpinning(false), 700);
  }

  function triggerClose() {
    setClosing(true);
    setTimeout(onClose, 280);
  }

  function handleClose() {
    triggerClose();
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = false;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (touchStartY.current === null) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) {
      isDragging.current = true;
      setDragY(delta);
    }
  }

  function onTouchEnd() {
    if (dragY > SWIPE_THRESHOLD) {
      triggerClose();
    } else {
      setDragY(0);
    }
    touchStartY.current = null;
  }

  const sheetTranslate = closing
    ? "translateY(100%)"
    : visible
    ? `translateY(${dragY}px)`
    : "translateY(100%)";

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <style>{`
        @keyframes spin-ccw {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-720deg); }
        }
        .spin-ccw {
          animation: spin-ccw 0.7s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>

      {/* Backdrop — disappears immediately on close */}
      {!closing && (
        <div
          className="absolute inset-0 bg-black transition-opacity duration-300 ease-out"
          style={{
            opacity: visible ? 0.5 : 0,
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
          onClick={handleClose}
        />
      )}

      {/* Sheet */}
      <div
        className="relative z-10 overflow-hidden rounded-t-3xl"
        style={{
          transform: sheetTranslate,
          transition: isDragging.current ? "none" : "transform 0.3s ease-out",
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Base image */}
        <img
          src="/qr-screen.png"
          alt="모바일 학생증 QR"
          className="w-full block"
        />

        {/* Timer overlay */}
        <div
          className="absolute left-0 right-0 flex items-center justify-center gap-2"
          style={{ top: "calc(55% - 40px)" }}
        >
          <span className="text-white text-[14px] font-medium drop-shadow-md">
            {countdown}초 남았습니다.
          </span>
          <button
            onClick={handleRefresh}
            className="text-white opacity-90 active:opacity-60 transition-opacity drop-shadow-md"
          >
            <RotateCcw size={18} className={spinning ? "spin-ccw" : ""} />
          </button>
        </div>

        {/* Student info overlay */}
        <div
          className="absolute flex flex-col gap-[1px]"
          style={{ top: "calc(69% - 16px)", left: "calc(38% - 21px)" }}
        >
          <p className="text-white text-[17px] font-medium leading-tight drop-shadow" style={{ marginTop: "-4px" }}>{student.name}</p>
          <p className="text-[#b8b8b8] text-[14px] font-medium drop-shadow">{student.status}</p>
          <p className="text-[#b8b8b8] text-[14px] font-medium drop-shadow">학번 {student.studentId}</p>
          <p className="text-[#b8b8b8] text-[14px] font-medium drop-shadow">생년월일 {student.birthDate}</p>
        </div>
      </div>
    </div>
  );
}
