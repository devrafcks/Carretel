/**
 * Ícones Tabler (https://tabler.io/icons) com traço fino (1,5) por padrão — visual suave e minimalista.
 * Os nomes seguem o vocabulário usado no app; troque aqui para trocar o ícone em todo o produto.
 */
import * as React from "react";
import {
  IconAccessible, IconAlertTriangle, IconArchive, IconArrowBackUp, IconArrowLeft, IconArrowRight, IconBan,
  IconBrandWhatsapp, IconCalculator, IconCamera, IconCash, IconCheck, IconChevronDown, IconChevronRight,
  IconCircleCheck, IconCircleDot, IconCircleX, IconClock, IconCloudOff, IconCopy, IconCreditCard, IconDeviceMobile,
  IconDownload, IconExternalLink, IconEye, IconEyeOff, IconFileText, IconHome, IconInfoCircle, IconLinkOff,
  IconListCheck, IconLock, IconLogout, IconMenu2, IconMicrophone, IconMicrophoneOff, IconMinus, IconMoon,
  IconPackage, IconPencil, IconPlus, IconQrcode, IconRefresh, IconScale, IconScissors, IconShield, IconShieldCheck,
  IconSparkles, IconSun, IconTrash, IconTrendingDown, IconTrendingUp, IconTruckDelivery, IconUserPlus, IconUsers,
  IconUserX, IconWallet, IconWifi, IconX, IconLayoutGrid, IconChartBar, IconSearch, IconSettings, IconHelpCircle, IconUsersGroup, IconWifiOff, IconBell, IconBellRinging, IconChecks, IconCalendarDue, IconLanguage, IconKeyboard, IconContrast, IconHandFinger, IconBuildingStore, IconVolume, IconHeart,
  type Icon as TablerIcon,
  type IconProps,
} from "@tabler/icons-react";

export type AppIcon = React.FC<IconProps>;

function soft(C: TablerIcon, name: string): AppIcon {
  const Wrapped: AppIcon = ({ stroke = 1.6, ...props }) => <C stroke={stroke} {...props} />;
  Wrapped.displayName = name;
  return Wrapped;
}

export const Accessibility = soft(IconAccessible, "Accessibility");
export const Archive = soft(IconArchive, "Archive");
export const ArrowLeft = soft(IconArrowLeft, "ArrowLeft");
export const ArrowRight = soft(IconArrowRight, "ArrowRight");
export const Ban = soft(IconBan, "Ban");
export const Banknote = soft(IconCash, "Banknote");
export const Calculator = soft(IconCalculator, "Calculator");
export const Camera = soft(IconCamera, "Camera");
export const Check = soft(IconCheck, "Check");
export const ChevronDown = soft(IconChevronDown, "ChevronDown");
export const ChevronRight = soft(IconChevronRight, "ChevronRight");
export const CircleCheck = soft(IconCircleCheck, "CircleCheck");
export const CircleDot = soft(IconCircleDot, "CircleDot");
export const CircleX = soft(IconCircleX, "CircleX");
export const Clock = soft(IconClock, "Clock");
export const CloudOff = soft(IconCloudOff, "CloudOff");
export const Copy = soft(IconCopy, "Copy");
export const CreditCard = soft(IconCreditCard, "CreditCard");
export const Download = soft(IconDownload, "Download");
export const ExternalLink = soft(IconExternalLink, "ExternalLink");
export const Eye = soft(IconEye, "Eye");
export const EyeOff = soft(IconEyeOff, "EyeOff");
export const FileText = soft(IconFileText, "FileText");
export const Home = soft(IconHome, "Home");
export const Info = soft(IconInfoCircle, "Info");
export const Link2Off = soft(IconLinkOff, "Link2Off");
export const ListChecks = soft(IconListCheck, "ListChecks");
export const Lock = soft(IconLock, "Lock");
export const LogOut = soft(IconLogout, "LogOut");
export const Menu = soft(IconMenu2, "Menu");
export const MessageCircle = soft(IconBrandWhatsapp, "MessageCircle");
export const Mic = soft(IconMicrophone, "Mic");
export const MicOff = soft(IconMicrophoneOff, "MicOff");
export const Minus = soft(IconMinus, "Minus");
export const Moon = soft(IconMoon, "Moon");
export const Package = soft(IconPackage, "Package");
export const Pencil = soft(IconPencil, "Pencil");
export const Plus = soft(IconPlus, "Plus");
export const QrCode = soft(IconQrcode, "QrCode");
export const RefreshCw = soft(IconRefresh, "RefreshCw");
export const RotateCcw = soft(IconArrowBackUp, "RotateCcw");
export const Scale = soft(IconScale, "Scale");
export const Scissors = soft(IconScissors, "Scissors");
export const Shield = soft(IconShield, "Shield");
export const ShieldCheck = soft(IconShieldCheck, "ShieldCheck");
export const Smartphone = soft(IconDeviceMobile, "Smartphone");
export const Sparkles = soft(IconSparkles, "Sparkles");
export const Sun = soft(IconSun, "Sun");
export const Trash2 = soft(IconTrash, "Trash2");
export const TrendingDown = soft(IconTrendingDown, "TrendingDown");
export const TrendingUp = soft(IconTrendingUp, "TrendingUp");
export const TriangleAlert = soft(IconAlertTriangle, "TriangleAlert");
export const Truck = soft(IconTruckDelivery, "Truck");
export const UserPlus = soft(IconUserPlus, "UserPlus");
export const UserX = soft(IconUserX, "UserX");
export const Users = soft(IconUsers, "Users");
export const Wallet = soft(IconWallet, "Wallet");
export const Wifi = soft(IconWifi, "Wifi");
export const X = soft(IconX, "X");
export const LayoutGrid = soft(IconLayoutGrid, "LayoutGrid");
export const ChartBar = soft(IconChartBar, "ChartBar");
export const Search = soft(IconSearch, "Search");
export const Settings = soft(IconSettings, "Settings");
export const Help = soft(IconHelpCircle, "Help");
export const Team = soft(IconUsersGroup, "Team");
export const WifiOff = soft(IconWifiOff, "WifiOff");
export const Bell = soft(IconBell, "Bell");
export const BellRinging = soft(IconBellRinging, "BellRinging");
export const CheckAll = soft(IconChecks, "CheckAll");
export const CalendarDue = soft(IconCalendarDue, "CalendarDue");
export const Languages = soft(IconLanguage, "Languages");
export const Keyboard = soft(IconKeyboard, "Keyboard");
export const Contrast = soft(IconContrast, "Contrast");
export const HandFinger = soft(IconHandFinger, "HandFinger");
export const Store = soft(IconBuildingStore, "Store");
export const Volume2 = soft(IconVolume, "Volume2");
export const Heart = soft(IconHeart, "Heart");
